import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Bool "mo:core/Bool";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Specify the data migration function in with-clause

actor {
  include MixinStorage();

  // Product Types
  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    imageUrl : ?Text;
  };

  public type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  public type Order = {
    id : Nat;
    productId : Nat;
    quantity : Nat;
    totalPrice : Nat;
    customerName : Text;
    customerPhone : Text;
    couponUsed : ?Text;
    street : Text;
    city : Text;
    pinCode : Text;
  };

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  // Coupon Types
  let coupons = Map.fromIter<Text, Nat>([
    ("DINO20", 20),
    ("DINO50", 50),
    ("DINO100", 100),
    ("DINO150", 150),
    ("DINO200", 200),
    ("FREEALVRA", 349),
  ].values());

  // Content Block Types
  public type ContentBlock = {
    key : Text;
    value : Text;
  };

  // Persistent State
  var nextOrderId = 1;
  let products = Map.empty<Nat, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Nat, Order>();
  let contentBlocks = Map.empty<Text, ContentBlock>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Access Control State (Persistent)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Cart Management
  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    if (not products.containsKey(productId)) {
      Runtime.trap("Product does not exist");
    };

    let userCart = switch (carts.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };

    userCart.add({
      productId;
      quantity;
    });

    carts.add(caller, userCart);
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove items from cart");
    };

    let userCart = switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cart) { cart };
    };

    let filteredCart = List.empty<CartItem>();
    for (item in userCart.values()) {
      if (item.productId != productId) {
        filteredCart.add(item);
      };
    };

    carts.add(caller, filteredCart);
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    carts.remove(caller);
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  // Coupon Validation
  public query func validateCoupon(code : Text) : async {
    code : Text;
    discountAmount : Nat;
  } {
    switch (coupons.get(code)) {
      case (null) { Runtime.trap("Invalid coupon code") };
      case (?discount) {
        {
          code;
          discountAmount = discount;
        };
      };
    };
  };

  // Place Order
  public shared ({ caller }) func placeOrder(
    productId : Nat,
    quantity : Nat,
    couponCode : ?Text,
    customerName : Text,
    customerPhone : Text
  ) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    var totalPrice = product.price * quantity;

    switch (couponCode) {
      case (?code) {
        let _ = validateCoupon(code);
        let discount = switch (coupons.get(code)) {
          case (null) { Runtime.trap("Coupon not found") };
          case (?d) { d };
        };
        if (discount >= totalPrice) {
          totalPrice := 0;
        } else {
          totalPrice -= discount;
        };
      };
      case (null) {};
    };

    let order = {
      id = nextOrderId;
      productId;
      quantity;
      totalPrice;
      customerName;
      customerPhone;
      couponUsed = couponCode;
      street = "";
      city = "";
      pinCode = "";
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;

    order;
  };

  // New Place Order with Address
  public shared ({ caller }) func placeOrderWithAddress(
    productId : Nat,
    quantity : Nat,
    couponCode : ?Text,
    customerName : Text,
    customerPhone : Text,
    street : Text,
    city : Text,
    pinCode : Text
  ) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    var totalPrice = product.price * quantity;

    switch (couponCode) {
      case (?code) {
        let _ = validateCoupon(code);
        let discount = switch (coupons.get(code)) {
          case (null) { Runtime.trap("Coupon not found") };
          case (?d) { d };
        };
        if (discount >= totalPrice) {
          totalPrice := 0;
        } else {
          totalPrice -= discount;
        };
      };
      case (null) {};
    };

    let order = {
      id = nextOrderId;
      productId;
      quantity;
      totalPrice;
      customerName;
      customerPhone;
      couponUsed = couponCode;
      street;
      city;
      pinCode;
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;

    order;
  };

  // Order Retrieval (Admins Only)
  public query ({ caller }) func getOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can retrieve all orders");
    };
    orders.values().toArray();
  };

  // Set Product Image
  public shared ({ caller }) func setProductImage(productId : Nat, imageUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set product images");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    let updatedProduct = {
      product with
      imageUrl = ?imageUrl;
    };

    products.add(productId, updatedProduct);
  };

  // Product Initialization (Admin Only)
  public shared ({ caller }) func initializeProducts() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize products");
    };

    if (products.size() > 0) {
      Runtime.trap("Products already initialized");
    };

    let defaultProducts : [Product] = [
      {
        id = 1;
        name = "Men Formal Perfume";
        description = "Perfect for office wear";
        price = 799;
        category = "Men Formal";
        imageUrl = null;
      },
      {
        id = 2;
        name = "Men Party Perfume";
        description = "Ideal for party events";
        price = 799;
        category = "Men Party";
        imageUrl = null;
      },
      {
        id = 3;
        name = "Women Formal Perfume";
        description = "Elegant fragrance for women";
        price = 799;
        category = "Women Formal";
        imageUrl = null;
      },
      {
        id = 4;
        name = "Women Party Perfume";
        description = "Great for special occasions";
        price = 799;
        category = "Women Party";
        imageUrl = null;
      },
    ];

    for (product in defaultProducts.values()) {
      products.add(product.id, product);
    };
  };

  // Content Block Management
  public query ({ caller }) func getContent() : async [ContentBlock] {
    contentBlocks.values().toArray();
  };

  public shared ({ caller }) func updateContent(key : Text, value : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only administrators can update content");
    };

    let contentBlock = {
      key;
      value;
    };
    contentBlocks.add(key, contentBlock);
  };

  public query ({ caller }) func getContentByKey(key : Text) : async ?Text {
    switch (contentBlocks.get(key)) {
      case (null) { null };
      case (?block) { ?block.value };
    };
  };

  // Check if Caller is Admin
  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };
};
