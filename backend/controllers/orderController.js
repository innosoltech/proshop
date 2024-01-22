import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// NOTE:
// @desc            Create new order
// @route           POST /api/orders
// @access          Private
// asyncHandler:    allows us to avoid using try/catch block for async functions (async functions returns a promise).
const addOrderItems = asyncHandler(async (req, res) => {
  // console.log(req.body);
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order item(s)");
  } else {
    const order = new Order({
      orderItems: orderItems.map((orderItem) => ({
        ...orderItem,
        product: orderItem._id,
        _id: undefined,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

// NOTE:
// @desc            Get logged in user order
// @route           GET /api/orders/myorders
// @access          Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: "desc",
  });
  res.status(200).json(orders);
});

// NOTE:
// @desc            Get order by ID
// @route           GET /api/orders/:id
// @access          Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (order) {
    res.status(200).json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// NOTE:
// @desc            Update order to paid
// @route           PUT /api/orders/:id/pay
// @access          Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    // update countInStock Qty - 1st method
    for (const index in updatedOrder.orderItems) {
      const item = updatedOrder.orderItems[index];
      //console.log("Item - ", item);
      const product = await Product.findById(item.product);
      //console.log("Product - ", product);
      product.countInStock -= item.qty;
      //console.log("updatedQty - ", product.countInStock);
      product.save();
    }

    res.status(200).json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// NOTE:
// @desc            Update order to delivered
// @route           PUT /api/orders/:id/delivered
// @access          Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updateOrder = await order.save();

    res.status(200).json(updateOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// NOTE:
// @desc            Get all orders
// @route           GET /api/orders/
// @access          Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: "desc" })
    .populate("user", "id name");
  res.status(200).json(orders);
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
};
