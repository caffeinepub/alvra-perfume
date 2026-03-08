import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Order {
    id: bigint;
    customerName: string;
    couponUsed?: string;
    customerPhone: string;
    productId: bigint;
    quantity: bigint;
    totalPrice: bigint;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    category: string;
    price: bigint;
}
export interface Coupon {
    code: string;
    discountAmount: bigint;
}
export interface backendInterface {
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    clearCart(): Promise<void>;
    getAllProducts(): Promise<Array<Product>>;
    getCart(): Promise<Array<CartItem>>;
    getOrders(): Promise<Array<Order>>;
    initializeProducts(): Promise<void>;
    placeOrder(productId: bigint, quantity: bigint, couponCode: string | null, customerName: string, customerPhone: string): Promise<Order>;
    removeFromCart(productId: bigint): Promise<void>;
    validateCoupon(code: string): Promise<Coupon>;
}
