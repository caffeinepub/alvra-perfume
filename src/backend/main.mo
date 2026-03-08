import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  type Order = {
    id : Nat;
    productId : Nat;
    quantity : Nat;
    totalPrice : Nat;
    customerName : Text;
    customerPhone : Text;
    couponUsed : ?Text;
  };

  type Coupon = {
    code : Text;
    discountAmount : Nat;
  };

  let products = Map.empty<Nat, Product>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 1;

  let coupons = Map.fromIter<Text, Nat>([
    ("DINO20", 20),
    ("DINO50", 50),
    ("DINO100", 100),
    ("DINO150", 150),
    ("DINO200", 200),
    ("FREEALVRA", 349),
  ].values());

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
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
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    carts.remove(caller);
  };

  public query func validateCoupon(code : Text) : async Coupon {
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

  public shared ({ caller }) func placeOrder(productId : Nat, quantity : Nat, couponCode : ?Text, customerName : Text, customerPhone : Text) : async Order {
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
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;

    let orderId = nextOrderId - 1;
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Could not retrieve order") };
      case (?o) { o };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getOrders() : async [Order] {
    orders.values().toArray();
  };

  public shared ({ caller }) func initializeProducts() : async () {
    if (products.size() > 0) {
      Runtime.trap("Products already initialized");
    };

    products.add(
      1,
      {
        id = 1;
        name = "Morning Bliss";
        description = "A fresh, citrusy fragrance to start your day.";
        price = 349;
        category = "Daywear";
      },
    );

    products.add(
      2,
      {
        id = 2;
        name = "Evening Elegance";
        description = "Rich and deep scents for special occasions.";
        price = 399;
        category = "Evening";
      },
    );

    products.add(
      3,
      {
        id = 3;
        name = "Garden Whispers";
        description = "Floral notes inspired by nature.";
        price = 299;
        category = "Floral";
      },
    );

    products.add(
      4,
      {
        id = 4;
        name = "Ocean Breeze";
        description = "Light and invigorating fragrance.";
        price = 329;
        category = "Fresh";
      },
    );
  };
};
