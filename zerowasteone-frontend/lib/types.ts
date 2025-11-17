export type Category = { category_id:number; name:string; description?:string|null };
export type Supplier = { supplier_id:number; name:string; contact_info?:string|null; address?:string|null };
export type Item = {
  item_id:number; name:string; quantity:number; unit:string|null;
  expiry_date:string|null; category_id:number|null; supplier_id:number|null;
  reorder_level:number|null;
};
