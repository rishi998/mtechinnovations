/** Line item shape for POST /salesorders (Zoho Inventory v1). */
export interface ZohoCreateSalesOrderLineItem {
  /** String — Zoho long ids exceed JS Number.MAX_SAFE_INTEGER; never use Number(). */
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
  unit: string;
  /** When org requires tax (e.g. GST), set via env ZOHO_SALES_ORDER_LINE_TAX_ID in ZohoService. */
  tax_id?: string;
}

export interface ZohoCreateSalesOrderPayload {
  /** String — same precision rule as item_id. */
  customer_id: string;
  date: string;
  line_items: ZohoCreateSalesOrderLineItem[];
  /** When using exemption instead of line tax; set via env in ZohoService. */
  tax_exemption_id?: string;
}
