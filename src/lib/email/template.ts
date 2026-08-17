import { formatPrice } from "@/lib/catalog/format";
import type { OrderConfirmationEmailInput } from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PAPER = "#F4EFE6";
const INK = "#141414";
const RED = "#C1121F";
const VOID = "#131315";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lineRowHTML(item: OrderConfirmationEmailInput["items"][number]): string {
  const unit = formatPrice(item.unitPriceCents);
  const total = formatPrice(item.unitPriceCents * item.qty);
  return `
    <tr>
      <td style="font-size:14px;line-height:1.5;color:${INK};padding:10px 0;border-bottom:1px solid #D2CDC6;">
        <span style="font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;text-transform:uppercase;">${esc(item.productName)}</span>
        <span style="color:${INK};opacity:.6;"> · talla ${esc(item.size)}</span>
      </td>
      <td style="font-size:14px;color:${INK};padding:10px 0;border-bottom:1px solid #D2CDC6;text-align:center;font-variant-numeric:tabular-nums;">${item.qty}</td>
      <td style="font-size:14px;color:${INK};padding:10px 0;border-bottom:1px solid #D2CDC6;text-align:right;font-variant-numeric:tabular-nums;">${unit}</td>
      <td style="font-size:14px;font-weight:700;color:${RED};padding:10px 0;border-bottom:1px solid #D2CDC6;text-align:right;font-variant-numeric:tabular-nums;">${total}</td>
    </tr>`;
}

function itemsTableHTML(
  items: OrderConfirmationEmailInput["items"],
  subtotalCents: number,
  totalCents: number,
): string {
  const rows = items.map(lineRowHTML).join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr>
          <th align="left" style="font-family:'Space Grotesk',Arial,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${INK};opacity:.6;padding:6px 0;border-bottom:2px solid ${INK};">Artículo</th>
          <th align="center" style="font-family:'Space Grotesk',Arial,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${INK};opacity:.6;padding:6px 0;border-bottom:2px solid ${INK};">Cant.</th>
          <th align="right" style="font-family:'Space Grotesk',Arial,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${INK};opacity:.6;padding:6px 0;border-bottom:2px solid ${INK};">Unit.</th>
          <th align="right" style="font-family:'Space Grotesk',Arial,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${RED};padding:6px 0;border-bottom:2px solid ${INK};">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px 0;"></td>
          <td align="right" style="padding:10px 0;color:${INK};opacity:.6;font-size:13px;">Subtotal</td>
          <td align="right" style="padding:10px 0;font-weight:700;font-size:14px;color:${INK};font-variant-numeric:tabular-nums;">${formatPrice(subtotalCents)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0;"></td>
          <td align="right" style="padding:4px 0;color:${RED};font-weight:700;font-size:14px;">Total</td>
          <td align="right" style="padding:4px 0;font-weight:700;font-size:16px;color:${RED};font-variant-numeric:tabular-nums;">${formatPrice(totalCents)}</td>
        </tr>
      </tfoot>
    </table>`;
}

export function renderOrderConfirmation(
  input: OrderConfirmationEmailInput,
): string {
  const successUrl = `${SITE_URL}/checkout/success?session_id=${encodeURIComponent(input.checkoutSessionId)}`;
  const catalogUrl = `${SITE_URL}/productos`;
  const created = new Date(input.createdAt).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pedido confirmado · AlterSTW</title>
  </head>
  <body style="margin:0;padding:0;background:${PAPER};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${PAPER};border:2px solid ${INK};">
            <tr>
              <td style="background:${VOID};padding:20px 28px;">
                <p style="margin:0;font-family:'Space Grotesk',Arial,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:20px;color:${PAPER};">ALTER<span style="color:${RED};">STW</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 6px;font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${RED};font-size:13px;">Pedido confirmado</p>
                <h1 style="margin:0 0 4px;font-family:'Space Grotesk',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.15;color:${INK};">¡Gracias, lo tenemos!</h1>
                <p style="margin:0;font-size:13px;color:${INK};opacity:.7;">
                  Pedido #${input.orderId} · ${created}<br />
                  Referencia: ${esc(input.checkoutSessionId)}
                </p>
                ${itemsTableHTML(input.items, input.subtotalCents, input.totalCents)}
                <p style="margin:20px 0 8px;font-size:14px;line-height:1.6;color:${INK};">
                  Tu pedido ya está en camino de ser empaquetado con mimo. Te
                  avisaremos cuando salga.
                </p>
                <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="background:${RED};padding:12px 24px;border-radius:2px;">
                      <a href="${successUrl}" style="font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:${PAPER};text-decoration:none;">Ver mi pedido →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;color:${INK};opacity:.7;">
                  ¿Quieres seguir explorando? <a href="${catalogUrl}" style="color:${RED};">Vuelve a la tienda</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}