// Thin data layer over the Supabase browser client.
// Used by landing/order (products) and summary/track (orders).
import { supabase } from "@/supabase";
import type { Order } from "@/lib/order-store";

// ---------- Products ----------
export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
};

export async function fetchProducts(limit = 12): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[products] fetch failed:", error.message);
    return [];
  }
  return data ?? [];
}

// ---------- Orders (mirror of the local order into Supabase) ----------
// We keep localStorage as the canonical client-side source (short PG###### IDs,
// works offline, no RLS surprises for anon users). Supabase gets a persistent
// audit copy so orders survive across devices/refreshes and admins can query them.
export async function saveOrderRemote(order: Order): Promise<{ id?: string; error?: string }> {
  const { options, delivery, total, id: displayId, status } = order;
  const subtotal = Math.max(0, total - (delivery.location?.deliveryFee ?? 0) - (options.urgent ? 15 : 0));

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: delivery.fullName,
      customer_phone: delivery.phone,
      customer_email: null,
      delivery_address: `${delivery.institute} — ${delivery.department}, ${delivery.address}`,
      delivery_lat: delivery.location?.lat ?? null,
      delivery_lng: delivery.location?.lng ?? null,
      distance_km: delivery.location?.distanceKm ?? null,
      subtotal,
      delivery_fee: delivery.location?.deliveryFee ?? 0,
      total,
      status: mapStatus(status),
      notes: displayId, // store our short PG###### id for lookup
    })
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[orders] insert failed:", error?.message);
    return { error: error?.message };
  }

  const items = (options.documents && options.documents.length > 0
    ? options.documents
    : [{
        id: "single", fileName: options.fileName, pages: options.pages,
        copies: options.copies, color: options.color, staple: options.finishing === "staple",
        spiralBinding: options.finishing === "bind", spiralType: "plastic" as const,
      }]
  ).map(d => ({
    order_id: data.id,
    file_name: d.fileName,
    pages: d.pages,
    copies: d.copies,
    color: d.color === "color",
    staple: !!d.staple,
    spiral: !!d.spiralBinding,
    binding_type: d.spiralBinding ? (d.spiralType ?? "plastic") : null,
    unit_price: d.color === "color" ? 10 : 3,
    line_total: (d.pages || 0) * (d.copies || 0) * (d.color === "color" ? 10 : 3),
  }));

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) console.warn("[order_items] insert failed:", itemsErr.message);
  }
  return { id: data.id };
}

export async function fetchOrderRemote(displayId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, notes, status, total, customer_name, delivery_address, distance_km, created_at, order_items(file_name, pages, copies, color)")
    .eq("notes", displayId)
    .maybeSingle();
  if (error) {
    console.warn("[orders] fetch failed:", error.message);
    return null;
  }
  return data;
}

// Local status labels → order_status enum values in the DB.
function mapStatus(s: string): string {
  switch (s) {
    case "Order Confirmed": return "confirmed";
    case "Printing Started":
    case "Printing Completed": return "printing";
    case "Picked Up By Delivery Partner":
    case "Out For Delivery": return "out_for_delivery";
    case "Delivered": return "delivered";
    default: return "pending";
  }
}
