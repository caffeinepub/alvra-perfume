import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
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

  type ContentBlock = {
    key : Text;
    value : Text;
  };

  type UserProfile = {
    name : Text;
  };

  // Old actor type without contentBlocks, accessControlState, and userProfiles fields.
  type OldActor = {
    products : Map.Map<Nat, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Nat, Order>;
    nextOrderId : Nat;
    coupons : Map.Map<Text, Nat>;
  };

  // New actor type with contentBlocks, accessControlState, and userProfiles fields.
  type NewActor = {
    products : Map.Map<Nat, Product>;
    carts : Map.Map<Principal, List.List<CartItem>>;
    orders : Map.Map<Nat, Order>;
    nextOrderId : Nat;
    coupons : Map.Map<Text, Nat>;
    contentBlocks : Map.Map<Text, ContentBlock>;
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      contentBlocks = Map.empty<Text, ContentBlock>();
      accessControlState = AccessControl.initState();
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
