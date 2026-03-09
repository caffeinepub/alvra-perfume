import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ContentBlock {
    key: string;
    value: string;
}
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Order {
    id: bigint;
    customerName: string;
    street: string;
    couponUsed?: string;
    customerPhone: string;
    city: string;
    productId: bigint;
    quantity: bigint;
    pinCode: string;
    totalPrice: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    id: bigint;
    name: string;
    description: string;
    imageUrl?: string;
    category: string;
    price: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getContent(): Promise<Array<ContentBlock>>;
    getContentByKey(key: string): Promise<string | null>;
    getOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeProducts(): Promise<void>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(productId: bigint, quantity: bigint, couponCode: string | null, customerName: string, customerPhone: string): Promise<Order>;
    placeOrderWithAddress(productId: bigint, quantity: bigint, couponCode: string | null, customerName: string, customerPhone: string, street: string, city: string, pinCode: string): Promise<Order>;
    removeFromCart(productId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setProductImage(productId: bigint, imageUrl: string): Promise<void>;
    updateContent(key: string, value: string): Promise<void>;
    validateCoupon(code: string): Promise<{
        code: string;
        discountAmount: bigint;
    }>;
}
