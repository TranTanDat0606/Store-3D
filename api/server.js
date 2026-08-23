var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/index.ts
var import_path, import_dotenv, requiredEnv, config;
var init_config = __esm({
  "src/config/index.ts"() {
    "use strict";
    import_path = __toESM(require("path"));
    import_dotenv = __toESM(require("dotenv"));
    import_dotenv.default.config();
    requiredEnv = [
      "MONGODB_URI",
      "JWT_SECRET"
    ];
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    config = {
      env: process.env.NODE_ENV || "development",
      port: Number(process.env.PORT) || 5e3,
      clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
      mongodbUri: process.env.MONGODB_URI,
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
      },
      rateLimit: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1e3,
        max: Number(process.env.RATE_LIMIT_MAX) || 300,
        authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20
      },
      uploadDir: process.env.UPLOAD_DIR || import_path.default.resolve(__dirname, "../../uploads"),
      bank: {
        bin: process.env.BANK_BIN || "",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
        accountName: process.env.BANK_ACCOUNT_NAME || "",
        accountDisplayName: process.env.BANK_ACCOUNT_DISPLAY_NAME || process.env.BANK_ACCOUNT_NAME || ""
      },
      qrTtlMinutes: Number(process.env.QR_TTL_MINUTES) || 5,
      paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || ""
    };
  }
});

// src/config/cors.ts
var corsOptions;
var init_cors = __esm({
  "src/config/cors.ts"() {
    "use strict";
    init_config();
    corsOptions = {
      origin: config.env === "production" ? config.clientUrl : true,
      credentials: true,
      optionsSuccessStatus: 200
    };
  }
});

// src/config/rateLimit.ts
var import_express_rate_limit, globalLimiter, authLimiter;
var init_rateLimit = __esm({
  "src/config/rateLimit.ts"() {
    "use strict";
    import_express_rate_limit = __toESM(require("express-rate-limit"));
    init_config();
    globalLimiter = (0, import_express_rate_limit.default)({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Qu\xE1 nhi\u1EC1u y\xEAu c\u1EA7u, vui l\xF2ng th\u1EED l\u1EA1i sau",
        data: null
      }
    });
    authLimiter = (0, import_express_rate_limit.default)({
      windowMs: 15 * 60 * 1e3,
      max: config.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Qu\xE1 nhi\u1EC1u l\u1EA7n th\u1EED \u0111\u0103ng nh\u1EADp, vui l\xF2ng th\u1EED l\u1EA1i sau 15 ph\xFAt",
        data: null
      }
    });
  }
});

// src/utils/AppError.ts
var AppError;
var init_AppError = __esm({
  "src/utils/AppError.ts"() {
    "use strict";
    AppError = class extends Error {
      statusCode;
      isOperational;
      constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
      }
    };
  }
});

// src/middleware/notFound.ts
function notFoundHandler(_req, _res, next) {
  next(new AppError("Kh\xF4ng t\xECm th\u1EA5y t\xE0i nguy\xEAn", 404));
}
var init_notFound = __esm({
  "src/middleware/notFound.ts"() {
    "use strict";
    init_AppError();
  }
});

// src/utils/apiResponse.ts
function successResponse(res, data, options = {}) {
  const { status = 200, message = "Th\xE0nh c\xF4ng", pagination, meta } = options;
  return res.status(status).json({
    success: true,
    message,
    data,
    ...pagination ? { pagination } : {},
    ...meta ? { meta } : {}
  });
}
function errorResponse(res, status, message, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    errors
  });
}
var init_apiResponse = __esm({
  "src/utils/apiResponse.ts"() {
    "use strict";
  }
});

// src/middleware/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  let statusCode = 500;
  let message = "\u0110\xE3 c\xF3 l\u1ED7i x\u1EA3y ra, vui l\xF2ng th\u1EED l\u1EA1i";
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof import_mongoose.default.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  } else if (err instanceof import_mongoose.default.Error.CastError) {
    statusCode = 400;
    message = "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Phi\xEAn \u0111\u0103ng nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message === "File too large" ? "File \u1EA3nh qu\xE1 l\u1EDBn (t\u1ED1i \u0111a 2MB)" : "File t\u1EA3i l\xEAn kh\xF4ng h\u1EE3p l\u1EC7";
  } else {
    const mongoErr = err;
    if (mongoErr.code === 11e3) {
      statusCode = 409;
      const field = Object.keys(mongoErr.keyPattern ?? {})[0] ?? "field";
      message = `${field} \u0111\xE3 t\u1ED3n t\u1EA1i`;
    }
  }
  if (config.env === "development") {
    console.error("[Error]", err);
  }
  return errorResponse(res, statusCode, message);
}
var import_mongoose;
var init_errorHandler = __esm({
  "src/middleware/errorHandler.ts"() {
    "use strict";
    import_mongoose = __toESM(require("mongoose"));
    init_config();
    init_AppError();
    init_apiResponse();
  }
});

// src/models/User.ts
var import_mongoose2, import_bcryptjs, UserRole, userSchema, User;
var init_User = __esm({
  "src/models/User.ts"() {
    "use strict";
    import_mongoose2 = require("mongoose");
    import_bcryptjs = __toESM(require("bcryptjs"));
    UserRole = /* @__PURE__ */ ((UserRole2) => {
      UserRole2["Admin"] = "admin";
      UserRole2["Customer"] = "customer";
      return UserRole2;
    })(UserRole || {});
    userSchema = new import_mongoose2.Schema(
      {
        fullname: {
          type: String,
          required: [true, "H\u1ECD v\xE0 t\xEAn l\xE0 b\u1EAFt bu\u1ED9c"],
          trim: true,
          maxlength: [100, "H\u1ECD v\xE0 t\xEAn t\u1ED1i \u0111a 100 k\xFD t\u1EF1"]
        },
        email: {
          type: String,
          required: [true, "Email l\xE0 b\u1EAFt bu\u1ED9c"],
          unique: true,
          lowercase: true,
          trim: true,
          match: [/^\S+@\S+\.\S+$/, "Email kh\xF4ng h\u1EE3p l\u1EC7"]
        },
        password: {
          type: String,
          required: [true, "M\u1EADt kh\u1EA9u l\xE0 b\u1EAFt bu\u1ED9c"],
          minlength: [6, "M\u1EADt kh\u1EA9u t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1"],
          select: false
        },
        phone: {
          type: String,
          trim: true,
          match: [/^[0-9+\-\s]{8,15}$/, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7"]
        },
        avatar: {
          type: String,
          default: ""
        },
        role: {
          type: String,
          enum: Object.values(UserRole),
          default: "customer" /* Customer */
        },
        address: {
          type: String,
          trim: true,
          default: ""
        },
        active: {
          type: Boolean,
          default: true
        }
      },
      { timestamps: true }
    );
    userSchema.pre("save", async function(next) {
      if (!this.isModified("password")) return next();
      const salt = await import_bcryptjs.default.genSalt(10);
      this.password = await import_bcryptjs.default.hash(this.password, salt);
      next();
    });
    userSchema.methods.comparePassword = function(candidate) {
      return import_bcryptjs.default.compare(candidate, this.password);
    };
    User = import_mongoose2.models.User || (0, import_mongoose2.model)("User", userSchema);
  }
});

// src/utils/slugify.ts
function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var init_slugify = __esm({
  "src/utils/slugify.ts"() {
    "use strict";
  }
});

// src/models/Category.ts
var import_mongoose3, categorySchema, Category;
var init_Category = __esm({
  "src/models/Category.ts"() {
    "use strict";
    import_mongoose3 = require("mongoose");
    init_slugify();
    categorySchema = new import_mongoose3.Schema(
      {
        name: {
          type: String,
          required: [true, "T\xEAn danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c"],
          trim: true,
          maxlength: [100, "T\xEAn danh m\u1EE5c t\u1ED1i \u0111a 100 k\xFD t\u1EF1"]
        },
        slug: {
          type: String,
          unique: true,
          lowercase: true,
          trim: true
        },
        image: {
          type: String,
          required: [true, "H\xECnh \u1EA3nh danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        description: {
          type: String,
          trim: true,
          default: ""
        }
      },
      { timestamps: true }
    );
    categorySchema.pre("validate", function(next) {
      if (this.name && !this.slug) {
        this.slug = slugify(this.name);
      }
      next();
    });
    Category = import_mongoose3.models.Category || (0, import_mongoose3.model)("Category", categorySchema);
  }
});

// src/models/Product.ts
var import_mongoose4, ProductStatus, productSchema, Product;
var init_Product = __esm({
  "src/models/Product.ts"() {
    "use strict";
    import_mongoose4 = require("mongoose");
    init_slugify();
    ProductStatus = /* @__PURE__ */ ((ProductStatus2) => {
      ProductStatus2["Active"] = "active";
      ProductStatus2["Inactive"] = "inactive";
      ProductStatus2["OutOfStock"] = "out-of-stock";
      return ProductStatus2;
    })(ProductStatus || {});
    productSchema = new import_mongoose4.Schema(
      {
        name: {
          type: String,
          required: [true, "T\xEAn s\u1EA3n ph\u1EA9m l\xE0 b\u1EAFt bu\u1ED9c"],
          trim: true,
          maxlength: [200, "T\xEAn s\u1EA3n ph\u1EA9m t\u1ED1i \u0111a 200 k\xFD t\u1EF1"]
        },
        slug: {
          type: String,
          unique: true,
          lowercase: true,
          trim: true
        },
        description: {
          type: String,
          trim: true,
          default: ""
        },
        images: {
          type: [String],
          default: [],
          validate: {
            validator: (arr) => arr.length > 0,
            message: "S\u1EA3n ph\u1EA9m c\u1EA7n \xEDt nh\u1EA5t 1 h\xECnh \u1EA3nh"
          }
        },
        category: {
          type: import_mongoose4.Schema.Types.ObjectId,
          ref: "Category",
          required: [true, "Danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        material: {
          type: String,
          enum: ["PLA", "PETG", "ABS", "Resin"],
          required: [true, "Ch\u1EA5t li\u1EC7u in l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        printerType: {
          type: String,
          enum: ["FDM", "Resin Printer"],
          required: [true, "Lo\u1EA1i m\xE1y in l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        size: {
          type: String,
          trim: true,
          default: ""
        },
        stock: {
          type: Number,
          required: [true, "S\u1ED1 l\u01B0\u1EE3ng t\u1ED3n kho l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [0, "T\u1ED3n kho kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"],
          default: 0
        },
        originalPrice: {
          type: Number,
          required: [true, "Gi\xE1 g\u1ED1c l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [0, "Gi\xE1 kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"]
        },
        salePrice: {
          type: Number,
          required: [true, "Gi\xE1 b\xE1n l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [0, "Gi\xE1 kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"]
        },
        rating: {
          type: Number,
          min: [0, "\u0110\xE1nh gi\xE1 t\u1ED1i thi\u1EC3u 0"],
          max: [5, "\u0110\xE1nh gi\xE1 t\u1ED1i \u0111a 5"],
          default: 0
        },
        reviewCount: {
          type: Number,
          min: 0,
          default: 0
        },
        status: {
          type: String,
          enum: Object.values(ProductStatus),
          default: "active" /* Active */
        },
        featured: {
          type: Boolean,
          default: false
        }
      },
      { timestamps: true }
    );
    productSchema.pre("validate", function(next) {
      if (this.name && !this.slug) {
        this.slug = slugify(this.name);
      }
      next();
    });
    productSchema.index({ name: "text", description: "text" });
    productSchema.index({ category: 1 });
    productSchema.index({ status: 1 });
    Product = import_mongoose4.models.Product || (0, import_mongoose4.model)("Product", productSchema);
  }
});

// src/models/Order.ts
var import_mongoose5, OrderStatus, PaymentMethod, PaymentStatus, orderSchema, Order;
var init_Order = __esm({
  "src/models/Order.ts"() {
    "use strict";
    import_mongoose5 = require("mongoose");
    OrderStatus = /* @__PURE__ */ ((OrderStatus2) => {
      OrderStatus2["Pending"] = "pending";
      OrderStatus2["Confirmed"] = "confirmed";
      OrderStatus2["Shipping"] = "shipping";
      OrderStatus2["Completed"] = "completed";
      OrderStatus2["Cancelled"] = "cancelled";
      return OrderStatus2;
    })(OrderStatus || {});
    PaymentMethod = /* @__PURE__ */ ((PaymentMethod2) => {
      PaymentMethod2["Cash"] = "cash";
      PaymentMethod2["BankTransfer"] = "bank-transfer";
      return PaymentMethod2;
    })(PaymentMethod || {});
    PaymentStatus = /* @__PURE__ */ ((PaymentStatus2) => {
      PaymentStatus2["Unpaid"] = "unpaid";
      PaymentStatus2["PendingPayment"] = "pending_payment";
      PaymentStatus2["Paid"] = "paid";
      return PaymentStatus2;
    })(PaymentStatus || {});
    orderSchema = new import_mongoose5.Schema(
      {
        user: {
          type: import_mongoose5.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Ng\u01B0\u1EDDi d\xF9ng l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        items: {
          type: [import_mongoose5.Schema.Types.ObjectId],
          ref: "OrderItem",
          default: []
        },
        customer: {
          name: { type: String, required: [true, "T\xEAn kh\xE1ch h\xE0ng l\xE0 b\u1EAFt bu\u1ED9c"], trim: true },
          phone: { type: String, required: [true, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i l\xE0 b\u1EAFt bu\u1ED9c"], trim: true },
          email: {
            type: String,
            required: [true, "Email l\xE0 b\u1EAFt bu\u1ED9c"],
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Email kh\xF4ng h\u1EE3p l\u1EC7"]
          },
          address: { type: String, required: [true, "\u0110\u1ECBa ch\u1EC9 l\xE0 b\u1EAFt bu\u1ED9c"], trim: true }
        },
        note: { type: String, trim: true, default: "" },
        subtotal: { type: Number, required: true, min: 0, default: 0 },
        discount: { type: Number, required: true, min: 0, default: 0 },
        shipping: { type: Number, required: true, min: 0, default: 0 },
        total: { type: Number, required: true, min: 0, default: 0 },
        coupon: {
          code: { type: String, trim: true, uppercase: true },
          discount: { type: Number, min: 0, default: 0 }
        },
        payment: {
          method: {
            type: String,
            enum: Object.values(PaymentMethod),
            default: "cash" /* Cash */
          },
          status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: "unpaid" /* Unpaid */
          },
          orderCode: { type: String, trim: true, uppercase: true },
          qrExpiresAt: { type: Date }
        },
        paidAt: { type: Date },
        status: {
          type: String,
          enum: Object.values(OrderStatus),
          default: "pending" /* Pending */
        }
      },
      { timestamps: true }
    );
    orderSchema.index({ user: 1 });
    orderSchema.index({ status: 1 });
    orderSchema.index({ createdAt: -1 });
    orderSchema.index({ "payment.orderCode": 1 }, { sparse: true, unique: true });
    Order = import_mongoose5.models.Order || (0, import_mongoose5.model)("Order", orderSchema);
  }
});

// src/models/OrderItem.ts
var import_mongoose6, orderItemSchema, OrderItem;
var init_OrderItem = __esm({
  "src/models/OrderItem.ts"() {
    "use strict";
    import_mongoose6 = require("mongoose");
    orderItemSchema = new import_mongoose6.Schema(
      {
        order: {
          type: import_mongoose6.Schema.Types.ObjectId,
          ref: "Order",
          required: true
        },
        product: {
          type: import_mongoose6.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 }
      },
      { timestamps: true }
    );
    orderItemSchema.index({ order: 1 });
    OrderItem = import_mongoose6.models.OrderItem || (0, import_mongoose6.model)("OrderItem", orderItemSchema);
  }
});

// src/models/Wishlist.ts
var import_mongoose7, wishlistSchema, Wishlist;
var init_Wishlist = __esm({
  "src/models/Wishlist.ts"() {
    "use strict";
    import_mongoose7 = require("mongoose");
    wishlistSchema = new import_mongoose7.Schema(
      {
        user: {
          type: import_mongoose7.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          unique: true
        },
        products: {
          type: [import_mongoose7.Schema.Types.ObjectId],
          ref: "Product",
          default: []
        }
      },
      { timestamps: true }
    );
    Wishlist = import_mongoose7.models.Wishlist || (0, import_mongoose7.model)("Wishlist", wishlistSchema);
  }
});

// src/models/Review.ts
var import_mongoose8, reviewSchema, Review;
var init_Review = __esm({
  "src/models/Review.ts"() {
    "use strict";
    import_mongoose8 = require("mongoose");
    reviewSchema = new import_mongoose8.Schema(
      {
        user: {
          type: import_mongoose8.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Ng\u01B0\u1EDDi \u0111\xE1nh gi\xE1 l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        product: {
          type: import_mongoose8.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "S\u1EA3n ph\u1EA9m l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        order: {
          type: import_mongoose8.Schema.Types.ObjectId,
          ref: "Order"
        },
        rating: {
          type: Number,
          required: [true, "S\u1ED1 sao l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [1, "\u0110\xE1nh gi\xE1 t\u1ED1i thi\u1EC3u 1 sao"],
          max: [5, "\u0110\xE1nh gi\xE1 t\u1ED1i \u0111a 5 sao"]
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [1e3, "B\xECnh lu\u1EADn t\u1ED1i \u0111a 1000 k\xFD t\u1EF1"],
          default: ""
        },
        images: {
          type: [String],
          default: []
        }
      },
      { timestamps: true }
    );
    reviewSchema.index({ product: 1, createdAt: -1 });
    reviewSchema.index({ user: 1, product: 1 }, { unique: true });
    Review = import_mongoose8.models.Review || (0, import_mongoose8.model)("Review", reviewSchema);
  }
});

// src/models/Coupon.ts
var import_mongoose9, CouponType, couponSchema, Coupon;
var init_Coupon = __esm({
  "src/models/Coupon.ts"() {
    "use strict";
    import_mongoose9 = require("mongoose");
    CouponType = /* @__PURE__ */ ((CouponType2) => {
      CouponType2["Percent"] = "percent";
      CouponType2["Fixed"] = "fixed";
      return CouponType2;
    })(CouponType || {});
    couponSchema = new import_mongoose9.Schema(
      {
        code: {
          type: String,
          required: [true, "M\xE3 gi\u1EA3m gi\xE1 l\xE0 b\u1EAFt bu\u1ED9c"],
          uppercase: true,
          trim: true,
          unique: true
        },
        discount: {
          type: Number,
          required: [true, "Gi\xE1 tr\u1ECB gi\u1EA3m l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [0, "Gi\xE1 tr\u1ECB gi\u1EA3m kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"]
        },
        type: {
          type: String,
          enum: Object.values(CouponType),
          default: "percent" /* Percent */
        },
        expiredDate: {
          type: Date,
          required: [true, "Ng\xE0y h\u1EBFt h\u1EA1n l\xE0 b\u1EAFt bu\u1ED9c"]
        },
        quantity: {
          type: Number,
          required: [true, "S\u1ED1 l\u01B0\u1EE3ng m\xE3 l\xE0 b\u1EAFt bu\u1ED9c"],
          min: [0, "S\u1ED1 l\u01B0\u1EE3ng kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"],
          default: 0
        },
        usedCount: {
          type: Number,
          default: 0,
          min: 0
        }
      },
      { timestamps: true }
    );
    Coupon = import_mongoose9.models.Coupon || (0, import_mongoose9.model)("Coupon", couponSchema);
  }
});

// src/models/index.ts
var init_models = __esm({
  "src/models/index.ts"() {
    "use strict";
    init_User();
    init_Category();
    init_Product();
    init_Order();
    init_OrderItem();
    init_Wishlist();
    init_Review();
    init_Coupon();
  }
});

// src/services/authService.ts
function toSafeUser(user) {
  const doc = user.toObject();
  const { password: _password, comparePassword: _comparePassword, ...safe } = doc;
  void _password;
  void _comparePassword;
  return safe;
}
var AuthService, authService;
var init_authService = __esm({
  "src/services/authService.ts"() {
    "use strict";
    init_models();
    init_AppError();
    AuthService = class {
      async register(data) {
        const email = data.email.toLowerCase().trim();
        const existing = await User.findOne({ email }).select("_id");
        if (existing) {
          throw new AppError("Email n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng k\xFD", 409);
        }
        const user = await User.create({
          fullname: data.fullname.trim(),
          email,
          password: data.password,
          phone: data.phone || "",
          address: data.address || "",
          role: "customer" /* Customer */
        });
        return { user: toSafeUser(user) };
      }
      async login(data) {
        const email = data.email.toLowerCase().trim();
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
          throw new AppError("Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng", 401);
        }
        const isMatch = await user.comparePassword(data.password);
        if (!isMatch) {
          throw new AppError("Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng", 401);
        }
        return { user: toSafeUser(user) };
      }
    };
    authService = new AuthService();
  }
});

// src/utils/asyncHandler.ts
function asyncHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
var init_asyncHandler = __esm({
  "src/utils/asyncHandler.ts"() {
    "use strict";
  }
});

// src/utils/token.ts
function signToken(userId, role) {
  const payload = { sub: String(userId), role };
  return import_jsonwebtoken.default.sign(payload, config.jwt.secret, { expiresIn });
}
function verifyToken(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, config.jwt.secret);
    if (typeof decoded === "object" && decoded.sub) {
      return { sub: String(decoded.sub), role: String(decoded.role ?? "customer") };
    }
    return null;
  } catch {
    return null;
  }
}
var import_jsonwebtoken, TOKEN_COOKIE_NAME, expiresIn, tokenCookieOptions;
var init_token = __esm({
  "src/utils/token.ts"() {
    "use strict";
    import_jsonwebtoken = __toESM(require("jsonwebtoken"));
    init_config();
    TOKEN_COOKIE_NAME = "token";
    expiresIn = config.jwt.expiresIn;
    tokenCookieOptions = {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    };
  }
});

// src/controllers/authController.ts
function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE_NAME, token, tokenCookieOptions);
}
var authController;
var init_authController = __esm({
  "src/controllers/authController.ts"() {
    "use strict";
    init_authService();
    init_asyncHandler();
    init_apiResponse();
    init_token();
    init_models();
    init_AppError();
    authController = {
      register: asyncHandler(async (req, res) => {
        const { user } = await authService.register(req.body);
        const token = signToken(user._id, user.role);
        setAuthCookie(res, token);
        return successResponse(res, user, { status: 201, message: "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng" });
      }),
      login: asyncHandler(async (req, res) => {
        const { user } = await authService.login(req.body);
        const token = signToken(user._id, user.role);
        setAuthCookie(res, token);
        return successResponse(res, user, { message: "\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng" });
      }),
      logout: asyncHandler(async (_req, res) => {
        res.clearCookie(TOKEN_COOKIE_NAME, { httpOnly: true, secure: tokenCookieOptions.secure, sameSite: tokenCookieOptions.sameSite });
        return successResponse(res, null, { message: "\u0110\u0103ng xu\u1EA5t th\xE0nh c\xF4ng" });
      }),
      me: asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        if (!user) throw new AppError("T\xE0i kho\u1EA3n kh\xF4ng t\u1ED3n t\u1EA1i", 404);
        return successResponse(res, user);
      }),
      updateProfile: asyncHandler(async (req, res) => {
        const user = await User.findByIdAndUpdate(
          req.user._id,
          {
            ...req.body.fullname !== void 0 && { fullname: req.body.fullname },
            ...req.body.phone !== void 0 && { phone: req.body.phone },
            ...req.body.address !== void 0 && { address: req.body.address },
            ...req.body.avatar !== void 0 && { avatar: req.body.avatar }
          },
          { new: true, runValidators: true }
        );
        if (!user) throw new AppError("T\xE0i kho\u1EA3n kh\xF4ng t\u1ED3n t\u1EA1i", 404);
        return successResponse(res, user, { message: "C\u1EADp nh\u1EADt h\u1ED3 s\u01A1 th\xE0nh c\xF4ng" });
      }),
      updatePassword: asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");
        if (!user) throw new AppError("T\xE0i kho\u1EA3n kh\xF4ng t\u1ED3n t\u1EA1i", 404);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new AppError("M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng", 400);
        user.password = newPassword;
        await user.save();
        return successResponse(res, null, { message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/middleware/auth.ts
async function requireAuth(req, _res, next) {
  const token = req.cookies?.[TOKEN_COOKIE_NAME] || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return next(new AppError("B\u1EA1n ch\u01B0a \u0111\u0103ng nh\u1EADp", 401));
  }
  const payload = verifyToken(token);
  if (!payload) {
    return next(new AppError("Phi\xEAn \u0111\u0103ng nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n", 401));
  }
  const user = await User.findById(payload.sub).select("_id role");
  if (!user) {
    return next(new AppError("T\xE0i kho\u1EA3n kh\xF4ng t\u1ED3n t\u1EA1i", 401));
  }
  req.user = { _id: String(user._id), role: user.role };
  next();
}
function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin" /* Admin */) {
    return next(new AppError("B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp", 403));
  }
  next();
}
var init_auth = __esm({
  "src/middleware/auth.ts"() {
    "use strict";
    init_models();
    init_AppError();
    init_token();
  }
});

// src/middleware/validate.ts
function validateRequest(schema, part = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return next(new AppError(messages.join("; "), 400));
    }
    req[part] = result.data;
    next();
  };
}
var init_validate = __esm({
  "src/middleware/validate.ts"() {
    "use strict";
    init_AppError();
  }
});

// src/validators/auth.ts
var import_zod, phoneRegex, emailSchema, registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema, adminCreateUserSchema;
var init_auth2 = __esm({
  "src/validators/auth.ts"() {
    "use strict";
    import_zod = require("zod");
    init_models();
    phoneRegex = /^[0-9+\-\s]{8,15}$/;
    emailSchema = import_zod.z.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").max(100);
    registerSchema = import_zod.z.object({
      fullname: import_zod.z.string().trim().min(2, "H\u1ECD v\xE0 t\xEAn t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(100, "H\u1ECD v\xE0 t\xEAn t\u1ED1i \u0111a 100 k\xFD t\u1EF1"),
      email: emailSchema,
      password: import_zod.z.string().min(6, "M\u1EADt kh\u1EA9u t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1").max(100, "M\u1EADt kh\u1EA9u t\u1ED1i \u0111a 100 k\xFD t\u1EF1"),
      phone: import_zod.z.string().regex(phoneRegex, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7").optional().or(import_zod.z.literal("")),
      address: import_zod.z.string().trim().max(500, "\u0110\u1ECBa ch\u1EC9 t\u1ED1i \u0111a 500 k\xFD t\u1EF1").optional().or(import_zod.z.literal(""))
    });
    loginSchema = import_zod.z.object({
      email: emailSchema,
      password: import_zod.z.string().min(1, "Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u")
    });
    updateProfileSchema = import_zod.z.object({
      fullname: import_zod.z.string().trim().min(2, "H\u1ECD v\xE0 t\xEAn t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(100).optional(),
      phone: import_zod.z.string().regex(phoneRegex, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7").optional().or(import_zod.z.literal("")),
      address: import_zod.z.string().trim().max(500).optional().or(import_zod.z.literal("")),
      avatar: import_zod.z.string().optional()
    });
    updatePasswordSchema = import_zod.z.object({
      currentPassword: import_zod.z.string().min(1, "Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i"),
      newPassword: import_zod.z.string().min(6, "M\u1EADt kh\u1EA9u m\u1EDBi t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1").max(100)
    });
    adminCreateUserSchema = import_zod.z.object({
      fullname: import_zod.z.string().trim().min(2).max(100),
      email: emailSchema,
      password: import_zod.z.string().min(6, "M\u1EADt kh\u1EA9u t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1").max(100),
      phone: import_zod.z.string().regex(phoneRegex, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7").optional().or(import_zod.z.literal("")),
      role: import_zod.z.enum(["admin" /* Admin */, "customer" /* Customer */]).optional(),
      address: import_zod.z.string().trim().max(500).optional().or(import_zod.z.literal(""))
    });
  }
});

// src/routes/auth.ts
var import_express, router, auth_default;
var init_auth3 = __esm({
  "src/routes/auth.ts"() {
    "use strict";
    import_express = require("express");
    init_authController();
    init_auth();
    init_validate();
    init_auth2();
    init_rateLimit();
    router = (0, import_express.Router)();
    router.post("/register", authLimiter, validateRequest(registerSchema), authController.register);
    router.post("/login", authLimiter, validateRequest(loginSchema), authController.login);
    router.post("/logout", authController.logout);
    router.get("/me", requireAuth, authController.me);
    router.put("/profile", requireAuth, validateRequest(updateProfileSchema), authController.updateProfile);
    router.put("/password", requireAuth, validateRequest(updatePasswordSchema), authController.updatePassword);
    auth_default = router;
  }
});

// src/utils/apiFeatures.ts
async function apiFeatures(query, filter, options) {
  const { page, limit, sort, search, searchFields } = options;
  const finalFilter = { ...filter };
  if (search && searchFields && searchFields.length > 0) {
    finalFilter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" }
    }));
  }
  const [total, data] = await Promise.all([
    query.model.countDocuments(finalFilter),
    query.find(finalFilter).sort(sort).skip((page - 1) * limit).limit(limit).exec()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  const rawSort = String(query.sort || "-createdAt");
  const sort = (FRIENDLY_SORT[rawSort] ?? rawSort).replace(/[^\w\s,.-]/g, "");
  const search = query.search ? String(query.search).trim() : void 0;
  return { page, limit, sort, search };
}
var FRIENDLY_SORT;
var init_apiFeatures = __esm({
  "src/utils/apiFeatures.ts"() {
    "use strict";
    FRIENDLY_SORT = {
      newest: "-createdAt",
      "price-asc": "salePrice",
      "price-desc": "-salePrice",
      rating: "-rating -reviewCount"
    };
  }
});

// src/services/productService.ts
function toObjectId(id) {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError("ID kh\xF4ng h\u1EE3p l\u1EC7", 400);
  }
  return new (require("mongoose")).Types.ObjectId(id);
}
async function ensureUniqueSlug(name, slug, excludeId) {
  const base = (slug && slug.trim() ? slug : slugify(name)) || slugify(name);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await Product.findOne({ slug: candidate }).select("_id");
    if (!existing || excludeId && String(existing._id) === excludeId) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}
var import_mongoose10, ProductService, productService;
var init_productService = __esm({
  "src/services/productService.ts"() {
    "use strict";
    import_mongoose10 = __toESM(require("mongoose"));
    init_models();
    init_AppError();
    init_apiFeatures();
    init_slugify();
    ProductService = class {
      buildFilter(params) {
        const filter = {};
        const { category, material, printerType, status, featured, minPrice, maxPrice } = params;
        if (category) filter.category = toObjectId(String(category));
        if (material) filter.material = material;
        if (printerType) filter.printerType = printerType;
        if (status) filter.status = status;
        if (featured === "true") filter.featured = true;
        if (featured === "false") filter.featured = false;
        if (minPrice !== void 0 || maxPrice !== void 0) {
          filter.salePrice = {
            ...minPrice !== void 0 ? { $gte: Number(minPrice) } : {},
            ...maxPrice !== void 0 ? { $lte: Number(maxPrice) } : {}
          };
        }
        return filter;
      }
      async list(params) {
        if (params.sort === "best-selling") {
          return this.listBestSelling(params);
        }
        if (params.sort === "discount") {
          return this.listDiscounted(params);
        }
        const options = { ...parsePagination(params), searchFields: ["name", "description"] };
        const filter = this.buildFilter(params);
        return apiFeatures(Product.find().populate("category", "name slug image"), filter, options);
      }
      /** Sorts by total quantity sold across all orders (products with no sales included last). */
      async listBestSelling(params) {
        const { page, limit, search } = parsePagination(params);
        const matchStage = { ...this.buildFilter(params) };
        if (search) {
          matchStage.$and = [
            {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
              ]
            }
          ];
        }
        const [total, docs] = await Promise.all([
          Product.countDocuments(matchStage),
          Product.aggregate([
            { $match: matchStage },
            { $lookup: { from: "orderitems", localField: "_id", foreignField: "product", as: "_orderItems" } },
            { $addFields: { _sold: { $sum: "$_orderItems.quantity" } } },
            { $sort: { _sold: -1, _id: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "_category" } },
            { $unwind: { path: "$_category", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: 1,
                slug: 1,
                description: 1,
                images: 1,
                material: 1,
                printerType: 1,
                size: 1,
                stock: 1,
                originalPrice: 1,
                salePrice: 1,
                rating: 1,
                reviewCount: 1,
                status: 1,
                featured: 1,
                createdAt: 1,
                updatedAt: 1,
                category: "$_category"
              }
            }
          ])
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          data: docs,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
      /** Sorts by discount ratio (salePrice/originalPrice) ascending — biggest discount first. */
      async listDiscounted(params) {
        const { page, limit, search } = parsePagination(params);
        const matchStage = {
          ...this.buildFilter(params),
          originalPrice: { $gt: 0 }
        };
        if (search) {
          matchStage.$and = [
            {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
              ]
            }
          ];
        }
        const [total, docs] = await Promise.all([
          Product.countDocuments(matchStage),
          Product.aggregate([
            { $match: matchStage },
            { $addFields: { _discountRatio: { $divide: ["$salePrice", "$originalPrice"] } } },
            { $sort: { _discountRatio: 1, _id: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "_category" } },
            { $unwind: { path: "$_category", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: 1,
                slug: 1,
                description: 1,
                images: 1,
                material: 1,
                printerType: 1,
                size: 1,
                stock: 1,
                originalPrice: 1,
                salePrice: 1,
                rating: 1,
                reviewCount: 1,
                status: 1,
                featured: 1,
                createdAt: 1,
                updatedAt: 1,
                category: "$_category"
              }
            }
          ])
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          data: docs,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
      /** Resolves a category slug into a product filter (used by GET /products?categorySlug=...). */
      async listByCategorySlug(categorySlug, params) {
        const category = await Category.findOne({ slug: categorySlug });
        if (!category) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y danh m\u1EE5c", 404);
        return this.list({ ...params, category: String(category._id) });
      }
      async getBySlug(slug) {
        let product = await Product.findOne({ slug }).populate("category", "name slug");
        if (!product && import_mongoose10.default.isValidObjectId(slug)) {
          product = await Product.findById(slug).populate("category", "name slug");
        }
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        return product;
      }
      async getById(id) {
        const product = await Product.findById(id).populate("category", "name slug");
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        return product;
      }
      async related(productId, categoryId, limit = 4) {
        return Product.find({
          _id: { $ne: productId },
          category: categoryId,
          status: "active" /* Active */
        }).select("name slug images originalPrice salePrice rating material").limit(limit);
      }
      async featured(params) {
        return this.list({ ...params, featured: "true", status: "active" /* Active */ });
      }
      async create(data) {
        const slug = await ensureUniqueSlug(data.name, data.slug);
        const product = await Product.create({ ...data, slug });
        return this.getById(String(product._id));
      }
      async update(id, data) {
        const existing = await Product.findById(id);
        if (!existing) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        let slug = existing.slug;
        if (data.slug && data.slug !== existing.slug || data.name && data.name !== existing.name) {
          slug = await ensureUniqueSlug(data.name ?? existing.name, data.slug, id);
        }
        const updated = await Product.findByIdAndUpdate(
          id,
          { ...data, slug },
          { new: true, runValidators: true }
        );
        return this.getById(String(updated._id));
      }
      async remove(id) {
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        return deleted;
      }
    };
    productService = new ProductService();
  }
});

// src/controllers/productController.ts
var productController;
var init_productController = __esm({
  "src/controllers/productController.ts"() {
    "use strict";
    init_productService();
    init_asyncHandler();
    init_apiResponse();
    productController = {
      list: asyncHandler(async (req, res) => {
        const { categorySlug, ...rest } = req.query;
        const result = categorySlug ? await productService.listByCategorySlug(String(categorySlug), rest) : await productService.list(req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      getBySlug: asyncHandler(async (req, res) => {
        const product = await productService.getBySlug(req.params.slug);
        return successResponse(res, product);
      }),
      related: asyncHandler(async (req, res) => {
        const product = await productService.getById(req.params.id);
        const related = await productService.related(
          String(product._id),
          String(product.category._id),
          Number(req.query.limit) || 4
        );
        return successResponse(res, related);
      }),
      featured: asyncHandler(async (req, res) => {
        const result = await productService.featured(req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      create: asyncHandler(async (req, res) => {
        toObjectId(req.body.category);
        const product = await productService.create(req.body);
        return successResponse(res, product, { status: 201, message: "T\u1EA1o s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng" });
      }),
      update: asyncHandler(async (req, res) => {
        if (req.body.category) toObjectId(req.body.category);
        const product = await productService.update(req.params.id, req.body);
        return successResponse(res, product, { message: "C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng" });
      }),
      remove: asyncHandler(async (req, res) => {
        await productService.remove(req.params.id);
        return successResponse(res, null, { message: "X\xF3a s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/validators/product.ts
var import_zod2, materialSchema, printerTypeSchema, createProductSchema, updateProductSchema, productQuerySchema;
var init_product = __esm({
  "src/validators/product.ts"() {
    "use strict";
    import_zod2 = require("zod");
    init_models();
    materialSchema = import_zod2.z.enum(["PLA", "PETG", "ABS", "Resin"], {
      errorMap: () => ({ message: "Ch\u1EA5t li\u1EC7u ph\u1EA3i l\xE0 PLA, PETG, ABS ho\u1EB7c Resin" })
    });
    printerTypeSchema = import_zod2.z.enum(["FDM", "Resin Printer"], {
      errorMap: () => ({ message: "Lo\u1EA1i m\xE1y in ph\u1EA3i l\xE0 FDM ho\u1EB7c Resin Printer" })
    });
    createProductSchema = import_zod2.z.object({
      name: import_zod2.z.string().trim().min(2, "T\xEAn s\u1EA3n ph\u1EA9m t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(200, "T\xEAn s\u1EA3n ph\u1EA9m t\u1ED1i \u0111a 200 k\xFD t\u1EF1"),
      slug: import_zod2.z.string().trim().optional(),
      description: import_zod2.z.string().trim().max(5e3, "M\xF4 t\u1EA3 t\u1ED1i \u0111a 5000 k\xFD t\u1EF1").optional().default(""),
      images: import_zod2.z.array(import_zod2.z.string()).min(1, "S\u1EA3n ph\u1EA9m c\u1EA7n \xEDt nh\u1EA5t 1 h\xECnh \u1EA3nh").max(8, "S\u1EA3n ph\u1EA9m t\u1ED1i \u0111a 8 h\xECnh \u1EA3nh"),
      category: import_zod2.z.string().min(1, "Danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c"),
      material: materialSchema,
      printerType: printerTypeSchema,
      size: import_zod2.z.string().trim().max(100, "K\xEDch th\u01B0\u1EDBc t\u1ED1i \u0111a 100 k\xFD t\u1EF1").optional().default(""),
      stock: import_zod2.z.coerce.number().int("S\u1ED1 l\u01B0\u1EE3ng ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn").min(0, "T\u1ED3n kho kh\xF4ng \u0111\u01B0\u1EE3c \xE2m").default(0),
      originalPrice: import_zod2.z.coerce.number().min(0, "Gi\xE1 g\u1ED1c kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"),
      salePrice: import_zod2.z.coerce.number().min(0, "Gi\xE1 b\xE1n kh\xF4ng \u0111\u01B0\u1EE3c \xE2m"),
      status: import_zod2.z.enum(Object.values(ProductStatus)).optional(),
      featured: import_zod2.z.boolean().optional().default(false)
    });
    updateProductSchema = createProductSchema.partial().extend({
      slug: import_zod2.z.string().trim().optional()
    });
    productQuerySchema = import_zod2.z.object({
      page: import_zod2.z.coerce.number().int().min(1).optional(),
      limit: import_zod2.z.coerce.number().int().min(1).max(100).optional(),
      sort: import_zod2.z.string().optional(),
      search: import_zod2.z.string().optional(),
      category: import_zod2.z.string().optional(),
      categorySlug: import_zod2.z.string().optional(),
      material: import_zod2.z.string().optional(),
      printerType: import_zod2.z.string().optional(),
      status: import_zod2.z.string().optional(),
      featured: import_zod2.z.enum(["true", "false"]).optional(),
      minPrice: import_zod2.z.coerce.number().min(0).optional(),
      maxPrice: import_zod2.z.coerce.number().min(0).optional()
    });
  }
});

// src/routes/product.ts
var import_express2, router2, product_default;
var init_product2 = __esm({
  "src/routes/product.ts"() {
    "use strict";
    import_express2 = require("express");
    init_productController();
    init_auth();
    init_validate();
    init_product();
    router2 = (0, import_express2.Router)();
    router2.get("/", validateRequest(productQuerySchema, "query"), productController.list);
    router2.get("/featured", productController.featured);
    router2.get("/:slug", productController.getBySlug);
    router2.get("/:id/related", productController.related);
    router2.post("/", requireAuth, requireAdmin, validateRequest(createProductSchema), productController.create);
    router2.put("/:id", requireAuth, requireAdmin, validateRequest(updateProductSchema), productController.update);
    router2.delete("/:id", requireAuth, requireAdmin, productController.remove);
    product_default = router2;
  }
});

// src/services/categoryService.ts
async function ensureUniqueSlug2(name, slug, excludeId) {
  const base = (slug && slug.trim() ? slug : slugify(name)) || slugify(name);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = await Category.findOne({ slug: candidate }).select("_id");
    if (!existing || excludeId && String(existing._id) === excludeId) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}
var CategoryService, categoryService;
var init_categoryService = __esm({
  "src/services/categoryService.ts"() {
    "use strict";
    init_models();
    init_AppError();
    init_apiFeatures();
    init_slugify();
    CategoryService = class {
      async list(params) {
        const options = parsePagination(params);
        return apiFeatures(Category.find(), {}, options);
      }
      /** All categories (for nav/filter dropdowns), no pagination. */
      async all() {
        return Category.aggregate([
          { $sort: { name: 1 } },
          { $lookup: { from: "products", localField: "_id", foreignField: "category", as: "__products" } },
          { $addFields: { productCount: { $size: "$__products" } } },
          { $project: { __products: 0 } }
        ]);
      }
      async getBySlug(slug) {
        const category = await Category.findOne({ slug });
        if (!category) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y danh m\u1EE5c", 404);
        return category;
      }
      async getById(id) {
        const category = await Category.findById(id);
        if (!category) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y danh m\u1EE5c", 404);
        return category;
      }
      async create(data) {
        const slug = await ensureUniqueSlug2(data.name, data.slug);
        const category = await Category.create({ ...data, slug });
        return this.getById(String(category._id));
      }
      async update(id, data) {
        const existing = await Category.findById(id);
        if (!existing) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y danh m\u1EE5c", 404);
        let slug = existing.slug;
        if (data.slug && data.slug !== existing.slug || data.name && data.name !== existing.name) {
          slug = await ensureUniqueSlug2(data.name ?? existing.name, data.slug, id);
        }
        const updated = await Category.findByIdAndUpdate(
          id,
          { ...data, slug },
          { new: true, runValidators: true }
        );
        return this.getById(String(updated._id));
      }
      async remove(id) {
        const count = await Product.countDocuments({ category: id });
        if (count > 0) {
          throw new AppError("Kh\xF4ng th\u1EC3 x\xF3a danh m\u1EE5c \u0111ang c\xF3 s\u1EA3n ph\u1EA9m", 400);
        }
        const deleted = await Category.findByIdAndDelete(id);
        if (!deleted) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y danh m\u1EE5c", 404);
        return deleted;
      }
    };
    categoryService = new CategoryService();
  }
});

// src/controllers/categoryController.ts
var categoryController;
var init_categoryController = __esm({
  "src/controllers/categoryController.ts"() {
    "use strict";
    init_categoryService();
    init_asyncHandler();
    init_apiResponse();
    categoryController = {
      list: asyncHandler(async (req, res) => {
        const result = await categoryService.list(req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      all: asyncHandler(async (_req, res) => {
        const categories = await categoryService.all();
        return successResponse(res, categories);
      }),
      getBySlug: asyncHandler(async (req, res) => {
        const category = await categoryService.getBySlug(req.params.slug);
        return successResponse(res, category);
      }),
      create: asyncHandler(async (req, res) => {
        const category = await categoryService.create(req.body);
        return successResponse(res, category, { status: 201, message: "T\u1EA1o danh m\u1EE5c th\xE0nh c\xF4ng" });
      }),
      update: asyncHandler(async (req, res) => {
        const category = await categoryService.update(req.params.id, req.body);
        return successResponse(res, category, { message: "C\u1EADp nh\u1EADt danh m\u1EE5c th\xE0nh c\xF4ng" });
      }),
      remove: asyncHandler(async (req, res) => {
        await categoryService.remove(req.params.id);
        return successResponse(res, null, { message: "X\xF3a danh m\u1EE5c th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/validators/category.ts
var import_zod3, createCategorySchema, updateCategorySchema;
var init_category = __esm({
  "src/validators/category.ts"() {
    "use strict";
    import_zod3 = require("zod");
    createCategorySchema = import_zod3.z.object({
      name: import_zod3.z.string().trim().min(2, "T\xEAn danh m\u1EE5c t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(100, "T\xEAn danh m\u1EE5c t\u1ED1i \u0111a 100 k\xFD t\u1EF1"),
      slug: import_zod3.z.string().trim().optional(),
      image: import_zod3.z.string().min(1, "H\xECnh \u1EA3nh danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c"),
      description: import_zod3.z.string().trim().max(1e3, "M\xF4 t\u1EA3 t\u1ED1i \u0111a 1000 k\xFD t\u1EF1").optional().default("")
    });
    updateCategorySchema = createCategorySchema.partial();
  }
});

// src/routes/category.ts
var import_express3, router3, category_default;
var init_category2 = __esm({
  "src/routes/category.ts"() {
    "use strict";
    import_express3 = require("express");
    init_categoryController();
    init_auth();
    init_validate();
    init_category();
    router3 = (0, import_express3.Router)();
    router3.get("/", categoryController.list);
    router3.get("/all", categoryController.all);
    router3.get("/:slug", categoryController.getBySlug);
    router3.post("/", requireAuth, requireAdmin, validateRequest(createCategorySchema), categoryController.create);
    router3.put("/:id", requireAuth, requireAdmin, validateRequest(updateCategorySchema), categoryController.update);
    router3.delete("/:id", requireAuth, requireAdmin, categoryController.remove);
    category_default = router3;
  }
});

// src/services/orderService.ts
async function resolveCoupon(code, subtotal) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng t\u1ED3n t\u1EA1i", 400);
  if (coupon.quantity <= coupon.usedCount) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt l\u01B0\u1EE3t s\u1EED d\u1EE5ng", 400);
  if (coupon.expiredDate < /* @__PURE__ */ new Date()) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt h\u1EA1n", 400);
  let discount = 0;
  if (coupon.type === "percent" /* Percent */) {
    discount = Math.round(subtotal * coupon.discount / 100);
  } else {
    discount = Math.min(coupon.discount, subtotal);
  }
  return { code: coupon.code, discount };
}
var import_mongoose11, ALLOWED_NEXT_STATUS, OrderService, orderService;
var init_orderService = __esm({
  "src/services/orderService.ts"() {
    "use strict";
    import_mongoose11 = require("mongoose");
    init_models();
    init_AppError();
    init_apiFeatures();
    ALLOWED_NEXT_STATUS = {
      ["pending" /* Pending */]: ["confirmed" /* Confirmed */, "cancelled" /* Cancelled */],
      ["confirmed" /* Confirmed */]: ["shipping" /* Shipping */],
      ["shipping" /* Shipping */]: ["completed" /* Completed */],
      ["completed" /* Completed */]: [],
      ["cancelled" /* Cancelled */]: []
    };
    OrderService = class {
      async create(userId, data) {
        const productIds = data.items.map((i) => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
          throw new AppError("C\xF3 s\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i trong gi\u1ECF h\xE0ng", 400);
        }
        const productMap = new Map(products.map((p) => [String(p._id), p]));
        const lineTotals = [];
        let subtotal = 0;
        for (const item of data.items) {
          const product = productMap.get(item.product);
          if (!product) throw new AppError("S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i", 400);
          if (product.stock < item.quantity) {
            throw new AppError(`S\u1EA3n ph\u1EA9m "${product.name}" kh\xF4ng \u0111\u1EE7 h\xE0ng`, 400);
          }
          const price = product.salePrice;
          subtotal += price * item.quantity;
          lineTotals.push({
            productId: String(product._id),
            price,
            quantity: item.quantity,
            name: product.name,
            image: product.images[0] ?? ""
          });
        }
        const coupon = await resolveCoupon(data.couponCode, subtotal);
        const shipping = 0;
        const total = subtotal - (coupon?.discount ?? 0) + shipping;
        const order = await Order.create({
          user: new import_mongoose11.Types.ObjectId(userId),
          customer: data.customer,
          note: data.note || "",
          subtotal,
          discount: coupon?.discount ?? 0,
          shipping,
          total,
          coupon: coupon ? { code: coupon.code, discount: coupon.discount } : void 0,
          payment: {
            method: data.paymentMethod || "cash" /* Cash */,
            status: "unpaid" /* Unpaid */
          },
          status: "pending" /* Pending */
        });
        const orderItems = await OrderItem.create(
          lineTotals.map((lt) => ({
            order: order._id,
            product: new import_mongoose11.Types.ObjectId(lt.productId),
            name: lt.name,
            image: lt.image,
            price: lt.price,
            quantity: lt.quantity
          }))
        );
        await Order.updateOne(
          { _id: order._id },
          { $set: { items: orderItems.map((oi) => oi._id) } }
        );
        for (const lt of lineTotals) {
          const updated = await Product.findOneAndUpdate(
            { _id: lt.productId, stock: { $gte: lt.quantity } },
            { $inc: { stock: -lt.quantity } },
            { new: true }
          );
          if (!updated) {
            await OrderItem.deleteMany({ order: order._id });
            await Order.findByIdAndDelete(order._id);
            throw new AppError(`S\u1EA3n ph\u1EA9m "${lt.name}" kh\xF4ng \u0111\u1EE7 h\xE0ng`, 400);
          }
        }
        if (coupon) {
          await Coupon.updateOne(
            { code: coupon.code },
            { $inc: { usedCount: 1 } }
          );
        }
        return this.getById(String(order._id));
      }
      /** Customer's own orders. */
      async listForUser(userId, params) {
        const options = parsePagination(params);
        const filter = { user: new import_mongoose11.Types.ObjectId(userId) };
        return apiFeatures(
          Order.find().populate("items").populate({ path: "items", populate: { path: "product", select: "name slug images salePrice" } }),
          filter,
          options
        );
      }
      /** Admin: all orders with search/filter. */
      async listAll(params) {
        const options = parsePagination(params);
        const filter = {};
        const { status, from, to } = params;
        if (status) filter.status = status;
        if (from || to) {
          filter.createdAt = {
            ...from ? { $gte: new Date(String(from)) } : {},
            ...to ? { $lte: new Date(String(to)) } : {}
          };
        }
        const searchTerm = options.search?.replace(/^#/, "").trim();
        if (searchTerm) {
          filter.$or = [
            { "customer.name": { $regex: searchTerm, $options: "i" } },
            { "customer.phone": { $regex: searchTerm, $options: "i" } },
            { "customer.email": { $regex: searchTerm, $options: "i" } },
            {
              $expr: {
                $regexMatch: {
                  input: { $toLower: { $toString: "$_id" } },
                  regex: searchTerm.toLowerCase()
                }
              }
            }
          ];
        }
        return apiFeatures(
          Order.find().populate("items"),
          filter,
          options
        );
      }
      async getById(id) {
        const order = await Order.findById(id).populate("items").populate({
          path: "items",
          populate: { path: "product", select: "name slug images salePrice" }
        });
        if (!order) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng", 404);
        return order;
      }
      async updateStatus(id, data) {
        const order = await Order.findById(id);
        if (!order) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng", 404);
        if (data.status !== order.status) {
          const allowed = ALLOWED_NEXT_STATUS[order.status] ?? [];
          if (!allowed.includes(data.status)) {
            throw new AppError("Kh\xF4ng th\u1EC3 chuy\u1EC3n tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng ng\u01B0\u1EE3c ho\u1EB7c b\u1ECF qua c\xE1c b\u01B0\u1EDBc", 400);
          }
        }
        if (data.status === "cancelled" /* Cancelled */ && order.status !== "cancelled" /* Cancelled */) {
          const items = await OrderItem.find({ order: order._id }).select("product quantity");
          if (items.length > 0) {
            await Product.bulkWrite(
              items.map((item) => ({
                updateOne: {
                  filter: { _id: item.product },
                  update: { $inc: { stock: item.quantity } }
                }
              }))
            );
          }
        }
        const updates = { status: data.status };
        if (data.paymentStatus) {
          updates["payment.status"] = data.paymentStatus;
          if (data.paymentStatus === "paid" /* Paid */ && !order.paidAt) {
            updates.paidAt = /* @__PURE__ */ new Date();
          }
        }
        if (data.status === "completed" /* Completed */ && order.payment?.status !== "paid" /* Paid */) {
          updates["payment.status"] = "paid" /* Paid */;
          if (!order.paidAt) {
            updates.paidAt = /* @__PURE__ */ new Date();
          }
        }
        const updated = await Order.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate("items").populate({ path: "items", populate: { path: "product", select: "name slug images salePrice" } });
        return updated;
      }
    };
    orderService = new OrderService();
  }
});

// src/services/vietQrService.ts
function getBankName(bin) {
  return BANK_NAMES[bin] ?? `Ng\xE2n h\xE0ng (${bin})`;
}
function buildVietQrQuickLink({
  bin,
  accountNumber,
  accountName,
  amount,
  content
}) {
  const base = `https://img.vietqr.io/image/${bin}-${accountNumber}-qr_only.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName
  });
  return `${base}?${params.toString()}`;
}
var BANK_NAMES;
var init_vietQrService = __esm({
  "src/services/vietQrService.ts"() {
    "use strict";
    BANK_NAMES = {
      "970418": "Vietcombank",
      "970415": "Sacombank",
      "970421": "VietinBank",
      "970422": "BIDV",
      "970436": "VPBank",
      "970448": "OCB",
      "970423": "TPBank \u2013 Ti\xEAn Phong Bank",
      "970462": "Eximbank",
      "970443": "SHB",
      "970489": "MSB"
    };
  }
});

// src/services/paymentService.ts
function generateOrderCode() {
  return `ST3D-${(0, import_crypto.randomBytes)(3).toString("hex").toUpperCase()}`;
}
function validateReconcile(order, amount, now) {
  if (order.status === "paid" /* Paid */) return { ok: true };
  if (order.status !== "pending_payment" /* PendingPayment */) {
    return { ok: false, code: 409, message: "\u0110\u01A1n h\xE0ng ch\u01B0a t\u1EA1o m\xE3 thanh to\xE1n" };
  }
  if (!order.qrExpiresAt || order.qrExpiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: 400, message: "M\xE3 QR \u0111\xE3 h\u1EBFt h\u1EA1n" };
  }
  if (amount !== order.total) {
    return { ok: false, code: 400, message: "S\u1ED1 ti\u1EC1n kh\xF4ng kh\u1EDBp v\u1EDBi \u0111\u01A1n h\xE0ng" };
  }
  return { ok: true };
}
var import_crypto, PaymentService, paymentService;
var init_paymentService = __esm({
  "src/services/paymentService.ts"() {
    "use strict";
    import_crypto = require("crypto");
    init_models();
    init_AppError();
    init_config();
    init_vietQrService();
    PaymentService = class {
      async createQrForOrder(userId, orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng", 404);
        if (String(order.user) !== userId) {
          throw new AppError("Kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp \u0111\u01A1n h\xE0ng n\xE0y", 403);
        }
        if (order.payment.method !== "bank-transfer" /* BankTransfer */) {
          throw new AppError("\u0110\u01A1n h\xE0ng kh\xF4ng d\xF9ng ph\u01B0\u01A1ng th\u1EE9c chuy\u1EC3n kho\u1EA3n", 400);
        }
        if (order.payment.status === "paid" /* Paid */) {
          throw new AppError("\u0110\u01A1n h\xE0ng \u0111\xE3 \u0111\u01B0\u1EE3c thanh to\xE1n", 400);
        }
        if (!config.bank.accountNumber || !config.bank.accountName) {
          throw new AppError("C\u1EA5u h\xECnh t\xE0i kho\u1EA3n ng\xE2n h\xE0ng ch\u01B0a \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp", 500);
        }
        const now = /* @__PURE__ */ new Date();
        const orderCode = order.payment.orderCode ?? generateOrderCode();
        const qrExpiresAt = new Date(now.getTime() + config.qrTtlMinutes * 60 * 1e3);
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              "payment.status": "pending_payment" /* PendingPayment */,
              "payment.orderCode": orderCode,
              "payment.qrExpiresAt": qrExpiresAt
            }
          }
        );
        const qrUrl = buildVietQrQuickLink({
          bin: config.bank.bin,
          accountNumber: config.bank.accountNumber,
          accountName: config.bank.accountName,
          amount: order.total,
          content: orderCode
        });
        return {
          bank: {
            bin: config.bank.bin,
            accountNumber: config.bank.accountNumber,
            accountName: config.bank.accountName,
            accountDisplayName: config.bank.accountDisplayName,
            bankName: getBankName(config.bank.bin)
          },
          qrUrl,
          orderCode,
          amount: order.total,
          expiresAt: qrExpiresAt
        };
      }
      async markOrderPaid(orderCode, amount) {
        const order = await Order.findOne({ "payment.orderCode": orderCode });
        if (!order) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng v\u1EDBi m\xE3 chuy\u1EC3n kho\u1EA3n n\xE0y", 404);
        const result = validateReconcile(
          { status: order.payment.status, qrExpiresAt: order.payment.qrExpiresAt, total: order.total },
          amount,
          /* @__PURE__ */ new Date()
        );
        if (!result.ok) throw new AppError(result.message, result.code);
        if (order.payment.status === "paid" /* Paid */) return order;
        return Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              "payment.status": "paid" /* Paid */,
              paidAt: /* @__PURE__ */ new Date(),
              status: "confirmed" /* Confirmed */
            }
          },
          { new: true }
        ).populate("items");
      }
    };
    paymentService = new PaymentService();
  }
});

// src/controllers/orderController.ts
var orderController;
var init_orderController = __esm({
  "src/controllers/orderController.ts"() {
    "use strict";
    init_orderService();
    init_paymentService();
    init_asyncHandler();
    init_apiResponse();
    init_models();
    init_AppError();
    orderController = {
      create: asyncHandler(async (req, res) => {
        const order = await orderService.create(req.user._id, req.body);
        return successResponse(res, order, { status: 201, message: "\u0110\u1EB7t h\xE0ng th\xE0nh c\xF4ng" });
      }),
      /** Customer's own order history. */
      mine: asyncHandler(async (req, res) => {
        const result = await orderService.listForUser(req.user._id, req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      /** Order detail — customers can only view their own. */
      getById: asyncHandler(async (req, res) => {
        const order = await orderService.getById(req.params.id);
        const isAdmin = req.user.role === "admin" /* Admin */;
        if (!isAdmin && String(order.user) !== req.user._id) {
          throw new AppError("Kh\xF4ng c\xF3 quy\u1EC1n xem \u0111\u01A1n h\xE0ng n\xE0y", 403);
        }
        return successResponse(res, order);
      }),
      /** Customer: generate a VietQR payment code for their order. */
      createPaymentQr: asyncHandler(async (req, res) => {
        const qr = await paymentService.createQrForOrder(req.user._id, req.params.id);
        return successResponse(res, qr, { message: "T\u1EA1o m\xE3 QR thanh to\xE1n th\xE0nh c\xF4ng" });
      }),
      /** Admin: list all orders. */
      adminList: asyncHandler(async (req, res) => {
        const result = await orderService.listAll(req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      /** Admin: update order status. */
      adminUpdateStatus: asyncHandler(async (req, res) => {
        const order = await orderService.updateStatus(req.params.id, req.body);
        return successResponse(res, order, { message: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/validators/order.ts
var import_zod4, phoneRegex2, orderItemSchema2, createOrderSchema, updateOrderStatusSchema, orderQuerySchema;
var init_order = __esm({
  "src/validators/order.ts"() {
    "use strict";
    import_zod4 = require("zod");
    init_models();
    phoneRegex2 = /^[0-9+\-\s]{8,15}$/;
    orderItemSchema2 = import_zod4.z.object({
      product: import_zod4.z.string().min(1, "S\u1EA3n ph\u1EA9m l\xE0 b\u1EAFt bu\u1ED9c"),
      quantity: import_zod4.z.coerce.number().int().min(1, "S\u1ED1 l\u01B0\u1EE3ng t\u1ED1i thi\u1EC3u 1")
    });
    createOrderSchema = import_zod4.z.object({
      customer: import_zod4.z.object({
        name: import_zod4.z.string().trim().min(2, "T\xEAn kh\xE1ch h\xE0ng t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(100),
        phone: import_zod4.z.string().regex(phoneRegex2, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7"),
        email: import_zod4.z.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").max(100),
        address: import_zod4.z.string().trim().min(5, "\u0110\u1ECBa ch\u1EC9 t\u1ED1i thi\u1EC3u 5 k\xFD t\u1EF1").max(500)
      }),
      items: import_zod4.z.array(orderItemSchema2).min(1, "Gi\u1ECF h\xE0ng tr\u1ED1ng"),
      note: import_zod4.z.string().trim().max(1e3, "Ghi ch\xFA t\u1ED1i \u0111a 1000 k\xFD t\u1EF1").optional().default(""),
      paymentMethod: import_zod4.z.enum(["cash" /* Cash */, "bank-transfer" /* BankTransfer */]).optional(),
      couponCode: import_zod4.z.string().trim().optional()
    });
    updateOrderStatusSchema = import_zod4.z.object({
      status: import_zod4.z.enum(Object.values(OrderStatus)),
      paymentStatus: import_zod4.z.enum(["unpaid", "paid"]).optional()
    });
    orderQuerySchema = import_zod4.z.object({
      page: import_zod4.z.coerce.number().int().min(1).optional(),
      limit: import_zod4.z.coerce.number().int().min(1).max(100).optional(),
      sort: import_zod4.z.string().optional(),
      search: import_zod4.z.string().optional(),
      status: import_zod4.z.string().optional(),
      from: import_zod4.z.string().optional(),
      to: import_zod4.z.string().optional()
    });
  }
});

// src/routes/order.ts
var import_express4, router4, order_default;
var init_order2 = __esm({
  "src/routes/order.ts"() {
    "use strict";
    import_express4 = require("express");
    init_orderController();
    init_auth();
    init_validate();
    init_order();
    router4 = (0, import_express4.Router)();
    router4.get("/admin", requireAuth, requireAdmin, validateRequest(orderQuerySchema, "query"), orderController.adminList);
    router4.put("/admin/:id/status", requireAuth, requireAdmin, validateRequest(updateOrderStatusSchema), orderController.adminUpdateStatus);
    router4.post("/", requireAuth, validateRequest(createOrderSchema), orderController.create);
    router4.get("/mine", requireAuth, validateRequest(orderQuerySchema, "query"), orderController.mine);
    router4.get("/:id", requireAuth, orderController.getById);
    router4.post("/:id/payment-qr", requireAuth, orderController.createPaymentQr);
    order_default = router4;
  }
});

// src/routes/payment.ts
var import_express5, router5, payment_default;
var init_payment = __esm({
  "src/routes/payment.ts"() {
    "use strict";
    import_express5 = require("express");
    init_asyncHandler();
    init_AppError();
    init_config();
    init_paymentService();
    init_apiResponse();
    router5 = (0, import_express5.Router)();
    router5.post(
      "/webhook",
      asyncHandler(async (req, res) => {
        if (config.paymentWebhookSecret && req.headers["x-payment-signature"] !== config.paymentWebhookSecret) {
          throw new AppError("Ch\u1EEF k\xFD webhook kh\xF4ng h\u1EE3p l\u1EC7", 401);
        }
        const { orderCode, amount } = req.body ?? {};
        await paymentService.markOrderPaid(String(orderCode ?? ""), Number(amount));
        return successResponse(res, { status: "success" }, { message: "Thanh to\xE1n \u0111\u01B0\u1EE3c x\xE1c nh\u1EADn" });
      })
    );
    router5.post(
      "/webhook/simulate",
      asyncHandler(async (req, res) => {
        if (config.env === "production") throw new AppError("Kh\xF4ng t\xECm th\u1EA5y trang", 404);
        const { orderCode, amount } = req.body ?? {};
        await paymentService.markOrderPaid(String(orderCode ?? ""), Number(amount));
        return successResponse(res, { status: "success" }, { message: "Thanh to\xE1n \u0111\u01B0\u1EE3c x\xE1c nh\u1EADn" });
      })
    );
    payment_default = router5;
  }
});

// src/services/wishlistService.ts
var WishlistService, wishlistService;
var init_wishlistService = __esm({
  "src/services/wishlistService.ts"() {
    "use strict";
    init_models();
    init_AppError();
    WishlistService = class {
      async ensureWishlist(userId) {
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
          wishlist = await Wishlist.create({ user: userId, products: [] });
        }
        return wishlist;
      }
      async get(userId) {
        const wishlist = await this.ensureWishlist(userId);
        await wishlist.populate("products");
        return wishlist;
      }
      async add(userId, productId) {
        const product = await Product.findById(productId);
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        const wishlist = await this.ensureWishlist(userId);
        const exists = wishlist.products.some((id) => String(id) === productId);
        if (!exists) {
          wishlist.products.push(product._id);
          await wishlist.save();
        }
        await wishlist.populate("products");
        return wishlist;
      }
      async remove(userId, productId) {
        const wishlist = await this.ensureWishlist(userId);
        wishlist.products = wishlist.products.filter((id) => String(id) !== productId);
        await wishlist.save();
        await wishlist.populate("products");
        return wishlist;
      }
      async moveToCart(userId, productId) {
        const product = await Product.findById(productId);
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        const wishlist = await this.ensureWishlist(userId);
        wishlist.products = wishlist.products.filter((id) => String(id) !== productId);
        await wishlist.save();
        await wishlist.populate("products");
        return { product, wishlist };
      }
    };
    wishlistService = new WishlistService();
  }
});

// src/controllers/wishlistController.ts
var wishlistController;
var init_wishlistController = __esm({
  "src/controllers/wishlistController.ts"() {
    "use strict";
    init_wishlistService();
    init_asyncHandler();
    init_apiResponse();
    wishlistController = {
      get: asyncHandler(async (req, res) => {
        const wishlist = await wishlistService.get(req.user._id);
        return successResponse(res, wishlist);
      }),
      add: asyncHandler(async (req, res) => {
        const wishlist = await wishlistService.add(req.user._id, req.body.productId);
        return successResponse(res, wishlist, { message: "\u0110\xE3 th\xEAm v\xE0o danh s\xE1ch y\xEAu th\xEDch" });
      }),
      remove: asyncHandler(async (req, res) => {
        const wishlist = await wishlistService.remove(req.user._id, req.params.productId);
        return successResponse(res, wishlist, { message: "\u0110\xE3 x\xF3a kh\u1ECFi danh s\xE1ch y\xEAu th\xEDch" });
      }),
      moveToCart: asyncHandler(async (req, res) => {
        const result = await wishlistService.moveToCart(req.user._id, req.body.productId);
        return successResponse(res, result, { message: "\u0110\xE3 chuy\u1EC3n v\xE0o gi\u1ECF h\xE0ng" });
      })
    };
  }
});

// src/routes/wishlist.ts
var import_express6, router6, wishlist_default;
var init_wishlist = __esm({
  "src/routes/wishlist.ts"() {
    "use strict";
    import_express6 = require("express");
    init_wishlistController();
    init_auth();
    router6 = (0, import_express6.Router)();
    router6.use(requireAuth);
    router6.get("/", wishlistController.get);
    router6.post("/", wishlistController.add);
    router6.delete("/:productId", wishlistController.remove);
    router6.post("/move-to-cart", wishlistController.moveToCart);
    wishlist_default = router6;
  }
});

// src/services/couponService.ts
var CouponService, couponService;
var init_couponService = __esm({
  "src/services/couponService.ts"() {
    "use strict";
    init_models();
    init_AppError();
    CouponService = class {
      async list() {
        return Coupon.find().sort({ createdAt: -1 });
      }
      async getById(id) {
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y m\xE3 gi\u1EA3m gi\xE1", 404);
        return coupon;
      }
      async create(data) {
        const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
        if (existing) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 t\u1ED3n t\u1EA1i", 409);
        return Coupon.create({ ...data, code: data.code.toUpperCase().trim() });
      }
      async update(id, data) {
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y m\xE3 gi\u1EA3m gi\xE1", 404);
        if (data.code && data.code.toUpperCase().trim() !== coupon.code) {
          const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
          if (existing) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 t\u1ED3n t\u1EA1i", 409);
        }
        const updated = await Coupon.findByIdAndUpdate(
          id,
          {
            ...data,
            ...data.code ? { code: data.code.toUpperCase().trim() } : {}
          },
          { new: true, runValidators: true }
        );
        return updated;
      }
      async remove(id) {
        const deleted = await Coupon.findByIdAndDelete(id);
        if (!deleted) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y m\xE3 gi\u1EA3m gi\xE1", 404);
        return deleted;
      }
      /** Public: validate a coupon and compute the discount for a given subtotal. */
      async apply(data) {
        const coupon = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
        if (!coupon) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng t\u1ED3n t\u1EA1i", 400);
        if (coupon.quantity <= coupon.usedCount) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt l\u01B0\u1EE3t s\u1EED d\u1EE5ng", 400);
        if (coupon.expiredDate < /* @__PURE__ */ new Date()) throw new AppError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt h\u1EA1n", 400);
        let discount = 0;
        if (coupon.type === "percent" /* Percent */) {
          discount = Math.round(data.subtotal * coupon.discount / 100);
        } else {
          discount = Math.min(coupon.discount, data.subtotal);
        }
        return { coupon, discount };
      }
    };
    couponService = new CouponService();
  }
});

// src/controllers/couponController.ts
var couponController;
var init_couponController = __esm({
  "src/controllers/couponController.ts"() {
    "use strict";
    init_couponService();
    init_asyncHandler();
    init_apiResponse();
    couponController = {
      list: asyncHandler(async (_req, res) => {
        const coupons = await couponService.list();
        return successResponse(res, coupons);
      }),
      getById: asyncHandler(async (req, res) => {
        const coupon = await couponService.getById(req.params.id);
        return successResponse(res, coupon);
      }),
      create: asyncHandler(async (req, res) => {
        const coupon = await couponService.create(req.body);
        return successResponse(res, coupon, { status: 201, message: "T\u1EA1o m\xE3 gi\u1EA3m gi\xE1 th\xE0nh c\xF4ng" });
      }),
      update: asyncHandler(async (req, res) => {
        const coupon = await couponService.update(req.params.id, req.body);
        return successResponse(res, coupon, { message: "C\u1EADp nh\u1EADt m\xE3 gi\u1EA3m gi\xE1 th\xE0nh c\xF4ng" });
      }),
      remove: asyncHandler(async (req, res) => {
        await couponService.remove(req.params.id);
        return successResponse(res, null, { message: "X\xF3a m\xE3 gi\u1EA3m gi\xE1 th\xE0nh c\xF4ng" });
      }),
      /** Public: validate a coupon against a subtotal. */
      apply: asyncHandler(async (req, res) => {
        const result = await couponService.apply(req.body);
        return successResponse(res, result, { message: "\xC1p d\u1EE5ng m\xE3 gi\u1EA3m gi\xE1 th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/validators/coupon.ts
var import_zod5, createCouponSchema, updateCouponSchema, applyCouponSchema;
var init_coupon = __esm({
  "src/validators/coupon.ts"() {
    "use strict";
    import_zod5 = require("zod");
    init_models();
    createCouponSchema = import_zod5.z.object({
      code: import_zod5.z.string().trim().min(2, "M\xE3 gi\u1EA3m gi\xE1 t\u1ED1i thi\u1EC3u 2 k\xFD t\u1EF1").max(50, "M\xE3 gi\u1EA3m gi\xE1 t\u1ED1i \u0111a 50 k\xFD t\u1EF1"),
      discount: import_zod5.z.coerce.number().min(1, "Gi\xE1 tr\u1ECB gi\u1EA3m t\u1ED1i thi\u1EC3u 1").max(1e8),
      type: import_zod5.z.enum(["percent" /* Percent */, "fixed" /* Fixed */]).default("percent" /* Percent */),
      expiredDate: import_zod5.z.coerce.date({ errorMap: () => ({ message: "Ng\xE0y h\u1EBFt h\u1EA1n kh\xF4ng h\u1EE3p l\u1EC7" }) }),
      quantity: import_zod5.z.coerce.number().int().min(0, "S\u1ED1 l\u01B0\u1EE3ng kh\xF4ng \u0111\u01B0\u1EE3c \xE2m").default(0)
    });
    updateCouponSchema = createCouponSchema.partial();
    applyCouponSchema = import_zod5.z.object({
      code: import_zod5.z.string().trim().min(1, "Vui l\xF2ng nh\u1EADp m\xE3 gi\u1EA3m gi\xE1"),
      subtotal: import_zod5.z.coerce.number().min(0)
    });
  }
});

// src/routes/coupon.ts
var import_express7, router7, coupon_default;
var init_coupon2 = __esm({
  "src/routes/coupon.ts"() {
    "use strict";
    import_express7 = require("express");
    init_couponController();
    init_auth();
    init_validate();
    init_coupon();
    router7 = (0, import_express7.Router)();
    router7.post("/apply", requireAuth, validateRequest(applyCouponSchema), couponController.apply);
    router7.get("/", requireAuth, requireAdmin, couponController.list);
    router7.get("/:id", requireAuth, requireAdmin, couponController.getById);
    router7.post("/", requireAuth, requireAdmin, validateRequest(createCouponSchema), couponController.create);
    router7.put("/:id", requireAuth, requireAdmin, validateRequest(updateCouponSchema), couponController.update);
    router7.delete("/:id", requireAuth, requireAdmin, couponController.remove);
    coupon_default = router7;
  }
});

// src/services/reviewService.ts
var import_mongoose12, ReviewService, reviewService;
var init_reviewService = __esm({
  "src/services/reviewService.ts"() {
    "use strict";
    import_mongoose12 = require("mongoose");
    init_models();
    init_AppError();
    init_apiFeatures();
    ReviewService = class {
      /** Reviews for a product (public). */
      async listByProduct(productId, params) {
        const options = parsePagination(params);
        return apiFeatures(
          Review.find({ product: productId }).populate("user", "fullname avatar"),
          { product: productId },
          { ...options, sort: "-createdAt" }
        );
      }
      async getById(id) {
        const review = await Review.findById(id).populate("user", "fullname avatar");
        if (!review) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\xE1nh gi\xE1", 404);
        return review;
      }
      /**
       * A user may review a product only after a qualifying purchase: they own an
       * order containing the product and that order is either fully paid or has
       * been delivered (completed).
       */
      async findQualifyingOrder(userId, productId) {
        const orderItems = await OrderItem.find({ product: productId }).select("order");
        const orderIds = orderItems.map((oi) => oi.order);
        return Order.findOne({
          _id: { $in: orderIds },
          user: userId,
          $or: [
            { status: "completed" /* Completed */ },
            { "payment.status": "paid" /* Paid */ }
          ]
        });
      }
      /** Whether the current user may review a product (purchase check). */
      async getMyEligibility(userId, productId) {
        const product = await Product.findById(productId);
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        const [purchased, existing] = await Promise.all([
          this.findQualifyingOrder(userId, productId),
          Review.findOne({ user: userId, product: productId })
        ]);
        return {
          product: productId,
          purchased: Boolean(purchased),
          hasReviewed: Boolean(existing),
          canReview: Boolean(purchased) && !existing,
          review: existing
        };
      }
      async create(userId, data) {
        const product = await Product.findById(data.product);
        if (!product) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m", 404);
        const existing = await Review.findOne({ user: userId, product: data.product });
        if (existing) throw new AppError("B\u1EA1n \u0111\xE3 \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m n\xE0y", 409);
        const qualifyingOrder = await this.findQualifyingOrder(userId, data.product);
        if (!qualifyingOrder) {
          throw new AppError("B\u1EA1n c\u1EA7n mua v\xE0 nh\u1EADn \u0111\u01B0\u1EE3c s\u1EA3n ph\u1EA9m n\xE0y tr\u01B0\u1EDBc khi \u0111\xE1nh gi\xE1", 403);
        }
        const review = await Review.create({ ...data, user: userId, order: qualifyingOrder._id });
        await this.updateProductRating(data.product);
        return this.getById(String(review._id));
      }
      async update(userId, reviewId, data) {
        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\xE1nh gi\xE1 c\u1EE7a b\u1EA1n", 404);
        review.rating = data.rating ?? review.rating;
        review.comment = data.comment ?? review.comment;
        review.images = data.images ?? review.images;
        await review.save();
        await this.updateProductRating(String(review.product));
        return this.getById(String(review._id));
      }
      async remove(userId, reviewId) {
        const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
        if (!review) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\xE1nh gi\xE1 c\u1EE7a b\u1EA1n", 404);
        await this.updateProductRating(String(review.product));
        return review;
      }
      /** Admin: list all reviews with pagination. */
      async listAll(params) {
        const options = parsePagination(params);
        const query = {};
        if (params.search) {
          query["$or"] = [
            { comment: { $regex: String(params.search), $options: "i" } }
          ];
        }
        return apiFeatures(
          Review.find(query).populate("user", "fullname avatar").populate("product", "name slug"),
          query,
          { ...options, sort: "-createdAt" }
        );
      }
      /** Admin: delete any review. */
      async adminRemove(reviewId) {
        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y \u0111\xE1nh gi\xE1", 404);
        await this.updateProductRating(String(review.product));
        return review;
      }
      async updateProductRating(productId) {
        const result = await Review.aggregate([
          { $match: { product: new import_mongoose12.Types.ObjectId(productId) } },
          { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);
        const stats = result[0];
        const newRating = stats ? Math.round(stats.avg * 10) / 10 : 0;
        const reviewCount = stats?.count ?? 0;
        await Product.updateOne({ _id: productId }, { rating: newRating, reviewCount });
      }
    };
    reviewService = new ReviewService();
  }
});

// src/controllers/reviewController.ts
var reviewController;
var init_reviewController = __esm({
  "src/controllers/reviewController.ts"() {
    "use strict";
    init_reviewService();
    init_asyncHandler();
    init_apiResponse();
    reviewController = {
      /** Public: reviews for a product. */
      listByProduct: asyncHandler(async (req, res) => {
        const result = await reviewService.listByProduct(req.params.productId, req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      /** Current user's review eligibility for a product (purchase check). */
      myEligibility: asyncHandler(async (req, res) => {
        const result = await reviewService.getMyEligibility(req.user._id, req.params.productId);
        return successResponse(res, result);
      }),
      create: asyncHandler(async (req, res) => {
        const review = await reviewService.create(req.user._id, req.body);
        return successResponse(res, review, { status: 201, message: "G\u1EEDi \u0111\xE1nh gi\xE1 th\xE0nh c\xF4ng" });
      }),
      update: asyncHandler(async (req, res) => {
        const review = await reviewService.update(req.user._id, req.params.id, req.body);
        return successResponse(res, review, { message: "C\u1EADp nh\u1EADt \u0111\xE1nh gi\xE1 th\xE0nh c\xF4ng" });
      }),
      remove: asyncHandler(async (req, res) => {
        await reviewService.remove(req.user._id, req.params.id);
        return successResponse(res, null, { message: "X\xF3a \u0111\xE1nh gi\xE1 th\xE0nh c\xF4ng" });
      }),
      /** Admin: list all reviews. */
      listAll: asyncHandler(async (req, res) => {
        const result = await reviewService.listAll(req.query);
        return successResponse(res, result.data, { pagination: result.pagination });
      }),
      /** Admin: delete any review. */
      adminRemove: asyncHandler(async (req, res) => {
        await reviewService.adminRemove(req.params.id);
        return successResponse(res, null, { message: "X\xF3a \u0111\xE1nh gi\xE1 th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/validators/review.ts
var import_zod6, createReviewSchema, updateReviewSchema, reviewQuerySchema;
var init_review = __esm({
  "src/validators/review.ts"() {
    "use strict";
    import_zod6 = require("zod");
    createReviewSchema = import_zod6.z.object({
      product: import_zod6.z.string().min(1, "S\u1EA3n ph\u1EA9m l\xE0 b\u1EAFt bu\u1ED9c"),
      rating: import_zod6.z.coerce.number().int().min(1, "\u0110\xE1nh gi\xE1 t\u1ED1i thi\u1EC3u 1 sao").max(5, "\u0110\xE1nh gi\xE1 t\u1ED1i \u0111a 5 sao"),
      comment: import_zod6.z.string().trim().max(1e3, "B\xECnh lu\u1EADn t\u1ED1i \u0111a 1000 k\xFD t\u1EF1").optional().default(""),
      images: import_zod6.z.array(import_zod6.z.string()).max(5, "T\u1ED1i \u0111a 5 h\xECnh \u1EA3nh").optional().default([])
    });
    updateReviewSchema = import_zod6.z.object({
      rating: import_zod6.z.coerce.number().int().min(1).max(5).optional(),
      comment: import_zod6.z.string().trim().max(1e3).optional(),
      images: import_zod6.z.array(import_zod6.z.string()).max(5).optional()
    });
    reviewQuerySchema = import_zod6.z.object({
      page: import_zod6.z.coerce.number().int().min(1).optional(),
      limit: import_zod6.z.coerce.number().int().min(1).max(50).optional()
    });
  }
});

// src/routes/review.ts
var import_express8, router8, review_default;
var init_review2 = __esm({
  "src/routes/review.ts"() {
    "use strict";
    import_express8 = require("express");
    init_reviewController();
    init_auth();
    init_validate();
    init_review();
    router8 = (0, import_express8.Router)();
    router8.get("/product/:productId", reviewController.listByProduct);
    router8.get("/admin", requireAuth, requireAdmin, reviewController.listAll);
    router8.delete("/admin/:id", requireAuth, requireAdmin, reviewController.adminRemove);
    router8.get("/me/:productId", requireAuth, reviewController.myEligibility);
    router8.post("/", requireAuth, validateRequest(createReviewSchema), reviewController.create);
    router8.put("/:id", requireAuth, validateRequest(updateReviewSchema), reviewController.update);
    router8.delete("/:id", requireAuth, reviewController.remove);
    review_default = router8;
  }
});

// src/services/userService.ts
var UserService, userService;
var init_userService = __esm({
  "src/services/userService.ts"() {
    "use strict";
    init_models();
    init_AppError();
    init_apiFeatures();
    UserService = class {
      async list(params) {
        const options = { ...parsePagination(params), searchFields: ["fullname", "email", "phone"] };
        const result = await apiFeatures(
          User.find(),
          {},
          options
        );
        const adminCount = await User.countDocuments({ role: "admin" /* Admin */ });
        return { ...result, adminCount };
      }
      async getById(id) {
        const user = await User.findById(id);
        if (!user) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng", 404);
        return user;
      }
      async updateRole(id, role) {
        const user = await User.findById(id);
        if (!user) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng", 404);
        if (user.role === "admin" /* Admin */ && role !== "admin" /* Admin */) {
          const adminCount = await User.countDocuments({ role: "admin" /* Admin */ });
          if (adminCount <= 1) {
            throw new AppError("Kh\xF4ng th\u1EC3 h\u1EA1 quy\u1EC1n admin cu\u1ED1i c\xF9ng c\u1EE7a h\u1EC7 th\u1ED1ng", 400);
          }
        }
        user.role = role;
        await user.save();
        return user;
      }
      async remove(id) {
        const user = await User.findById(id);
        if (!user) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng", 404);
        if (user.role === "admin" /* Admin */) {
          const adminCount = await User.countDocuments({ role: "admin" /* Admin */ });
          if (adminCount <= 1) {
            throw new AppError("Kh\xF4ng th\u1EC3 x\xF3a admin cu\u1ED1i c\xF9ng c\u1EE7a h\u1EC7 th\u1ED1ng", 400);
          }
        }
        await user.deleteOne();
        return user;
      }
      async toggleActive(id) {
        const user = await User.findById(id);
        if (!user) throw new AppError("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng", 404);
        user.active = !user.active;
        await user.save();
        return user;
      }
    };
    userService = new UserService();
  }
});

// src/controllers/userController.ts
var userController;
var init_userController = __esm({
  "src/controllers/userController.ts"() {
    "use strict";
    init_userService();
    init_asyncHandler();
    init_apiResponse();
    init_models();
    init_AppError();
    userController = {
      list: asyncHandler(async (req, res) => {
        const result = await userService.list(req.query);
        return successResponse(res, result.data, {
          pagination: result.pagination,
          meta: { adminCount: result.adminCount }
        });
      }),
      getById: asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id);
        return successResponse(res, user);
      }),
      updateRole: asyncHandler(async (req, res) => {
        if (!Object.values(UserRole).includes(req.body.role)) {
          throw new AppError("Vai tr\xF2 kh\xF4ng h\u1EE3p l\u1EC7", 400);
        }
        const user = await userService.updateRole(req.params.id, req.body.role);
        return successResponse(res, user, { message: "C\u1EADp nh\u1EADt vai tr\xF2 th\xE0nh c\xF4ng" });
      }),
      toggleActive: asyncHandler(async (req, res) => {
        const user = await userService.toggleActive(req.params.id);
        return successResponse(res, user, { message: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i th\xE0nh c\xF4ng" });
      }),
      remove: asyncHandler(async (req, res) => {
        await userService.remove(req.params.id);
        return successResponse(res, null, { message: "X\xF3a ng\u01B0\u1EDDi d\xF9ng th\xE0nh c\xF4ng" });
      })
    };
  }
});

// src/routes/user.ts
var import_express9, router9, user_default;
var init_user = __esm({
  "src/routes/user.ts"() {
    "use strict";
    import_express9 = require("express");
    init_userController();
    init_auth();
    router9 = (0, import_express9.Router)();
    router9.use(requireAuth, requireAdmin);
    router9.get("/", userController.list);
    router9.get("/:id", userController.getById);
    router9.put("/:id/role", userController.updateRole);
    router9.put("/:id/active", userController.toggleActive);
    router9.delete("/:id", userController.remove);
    user_default = router9;
  }
});

// src/services/statsService.ts
var StatsService, statsService;
var init_statsService = __esm({
  "src/services/statsService.ts"() {
    "use strict";
    init_models();
    StatsService = class {
      /** Overview cards: total revenue, orders, products, customers. */
      async overview() {
        const now = /* @__PURE__ */ new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const paidNotCancelled = { "payment.status": "paid" /* Paid */, status: { $ne: "cancelled" /* Cancelled */ } };
        const [
          revenueResult,
          totalOrders,
          totalProducts,
          totalCustomers,
          pendingOrders,
          completedOrders,
          todayRevenueResult,
          monthRevenueResult
        ] = await Promise.all([
          Order.aggregate([{ $match: paidNotCancelled }, { $group: { _id: null, total: { $sum: "$total" } } }]),
          Order.countDocuments(),
          Product.countDocuments(),
          User.countDocuments({ role: "customer" /* Customer */ }),
          Order.countDocuments({ status: "pending" /* Pending */ }),
          Order.countDocuments({ status: "completed" /* Completed */ }),
          Order.aggregate([
            { $match: paidNotCancelled },
            { $addFields: { revenueDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
            { $match: { revenueDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
          ]),
          Order.aggregate([
            { $match: paidNotCancelled },
            { $addFields: { revenueDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
            { $match: { revenueDate: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
          ])
        ]);
        return {
          totalRevenue: revenueResult[0]?.total ?? 0,
          todayRevenue: todayRevenueResult[0]?.total ?? 0,
          monthRevenue: monthRevenueResult[0]?.total ?? 0,
          totalOrders,
          totalProducts,
          totalCustomers,
          pendingOrders,
          completedOrders
        };
      }
      /** Revenue + order count per day for the last N days. */
      async revenueByDay(days = 30) {
        const since = /* @__PURE__ */ new Date();
        since.setDate(since.getDate() - (days - 1));
        since.setHours(0, 0, 0, 0);
        const rows = await Order.aggregate([
          {
            $match: {
              "payment.status": "paid" /* Paid */,
              status: { $ne: "cancelled" /* Cancelled */ }
            }
          },
          { $addFields: { revenueDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
          { $match: { revenueDate: { $gte: since } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$revenueDate" } },
              revenue: { $sum: "$total" },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        const map = new Map(rows.map((r) => [r._id, r]));
        const points = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          points.push({
            date: key,
            revenue: map.get(key)?.revenue ?? 0,
            orders: map.get(key)?.orders ?? 0
          });
        }
        return points;
      }
      /** Revenue + order count for a relative period: day / week / month / year. */
      async revenueByPeriod(period) {
        const now = /* @__PURE__ */ new Date();
        let from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (period === "week") {
          from.setDate(from.getDate() - (from.getDay() + 6) % 7);
        } else if (period === "month") {
          from = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "year") {
          from = new Date(now.getFullYear(), 0, 1);
        }
        const rows = await Order.aggregate([
          {
            $match: {
              "payment.status": "paid" /* Paid */,
              status: { $ne: "cancelled" /* Cancelled */ }
            }
          },
          { $addFields: { revenueDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
          { $match: { revenueDate: { $gte: from } } },
          { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }
        ]);
        return {
          period,
          from: from.toISOString(),
          to: now.toISOString(),
          revenue: rows[0]?.revenue ?? 0,
          orders: rows[0]?.orders ?? 0
        };
      }
      /** Top selling products by quantity sold. */
      async bestSelling(limit = 5) {
        const rows = await OrderItem.aggregate([
          {
            $group: {
              _id: "$product",
              totalSold: { $sum: "$quantity" },
              revenue: { $sum: { $multiply: ["$price", "$quantity"] } }
            }
          },
          { $sort: { totalSold: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "product"
            }
          },
          { $unwind: "$product" },
          {
            $project: {
              _id: 1,
              name: "$product.name",
              slug: "$product.slug",
              image: { $arrayElemAt: ["$product.images", 0] },
              totalSold: 1,
              revenue: 1
            }
          }
        ]);
        return rows;
      }
      /** Orders per status (for a status breakdown chart). */
      async ordersByStatus() {
        const rows = await Order.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        return rows.map((r) => ({ status: r._id, count: r.count }));
      }
    };
    statsService = new StatsService();
  }
});

// src/controllers/statsController.ts
var statsController;
var init_statsController = __esm({
  "src/controllers/statsController.ts"() {
    "use strict";
    init_statsService();
    init_asyncHandler();
    init_apiResponse();
    statsController = {
      overview: asyncHandler(async (_req, res) => {
        const data = await statsService.overview();
        return successResponse(res, data);
      }),
      revenueByDay: asyncHandler(async (req, res) => {
        const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
        const data = await statsService.revenueByDay(days);
        return successResponse(res, data);
      }),
      revenuePeriod: asyncHandler(async (req, res) => {
        const period = ["day", "week", "month", "year"].includes(String(req.query.period)) ? String(req.query.period) : "month";
        const data = await statsService.revenueByPeriod(period);
        return successResponse(res, data);
      }),
      bestSelling: asyncHandler(async (req, res) => {
        const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
        const data = await statsService.bestSelling(limit);
        return successResponse(res, data);
      }),
      ordersByStatus: asyncHandler(async (_req, res) => {
        const data = await statsService.ordersByStatus();
        return successResponse(res, data);
      })
    };
  }
});

// src/routes/stats.ts
var import_express10, router10, stats_default;
var init_stats = __esm({
  "src/routes/stats.ts"() {
    "use strict";
    import_express10 = require("express");
    init_statsController();
    init_auth();
    router10 = (0, import_express10.Router)();
    router10.use(requireAuth, requireAdmin);
    router10.get("/overview", statsController.overview);
    router10.get("/revenue", statsController.revenueByDay);
    router10.get("/revenue-period", statsController.revenuePeriod);
    router10.get("/best-selling", statsController.bestSelling);
    router10.get("/orders-by-status", statsController.ordersByStatus);
    stats_default = router10;
  }
});

// src/routes/upload.ts
var import_express11, import_multer, import_path2, import_crypto2, import_fs, storage, upload, router11, upload_default;
var init_upload = __esm({
  "src/routes/upload.ts"() {
    "use strict";
    import_express11 = require("express");
    import_multer = __toESM(require("multer"));
    import_path2 = __toESM(require("path"));
    import_crypto2 = __toESM(require("crypto"));
    import_fs = __toESM(require("fs"));
    init_auth();
    init_config();
    init_AppError();
    init_asyncHandler();
    init_apiResponse();
    storage = import_multer.default.diskStorage({
      destination: (_req, _file, cb) => {
        import_fs.default.mkdirSync(config.uploadDir, { recursive: true });
        cb(null, config.uploadDir);
      },
      filename: (_req, file, cb) => {
        const ext = import_path2.default.extname(file.originalname).toLowerCase() || ".png";
        cb(null, `${Date.now()}-${import_crypto2.default.randomBytes(6).toString("hex")}${ext}`);
      }
    });
    upload = (0, import_multer.default)({
      storage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new AppError("Ch\u1EC9 ch\u1EA5p nh\u1EADn file \u1EA3nh", 400));
      }
    });
    router11 = (0, import_express11.Router)();
    router11.post(
      "/",
      requireAuth,
      requireAdmin,
      upload.single("image"),
      asyncHandler(async (req, res) => {
        if (!req.file) {
          throw new AppError("Vui l\xF2ng ch\u1ECDn file \u1EA3nh", 400);
        }
        return successResponse(res, { url: `/uploads/${req.file.filename}` }, { message: "T\u1EA3i \u1EA3nh th\xE0nh c\xF4ng" });
      })
    );
    upload_default = router11;
  }
});

// src/app.ts
var app_exports = {};
__export(app_exports, {
  createApp: () => createApp
});
function createApp() {
  const app = (0, import_express12.default)();
  app.use(
    (0, import_helmet.default)({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use((0, import_cors.default)(corsOptions));
  app.use((0, import_cookie_parser.default)());
  app.use(import_express12.default.json({ limit: "15mb" }));
  app.use(import_express12.default.urlencoded({ extended: true, limit: "15mb" }));
  app.use(globalLimiter);
  app.use("/uploads", import_express12.default.static(config.uploadDir));
  app.get("/api/health", (_req, res) => {
    const state = import_mongoose13.default.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(200).json({
      success: true,
      message: "Store 3D API",
      data: { status: "ok", db: state, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    });
  });
  app.use("/api/auth", auth_default);
  app.use("/api/products", product_default);
  app.use("/api/categories", category_default);
  app.use("/api/orders", order_default);
  app.use("/api/payment", payment_default);
  app.use("/api/wishlist", wishlist_default);
  app.use("/api/coupons", coupon_default);
  app.use("/api/reviews", review_default);
  app.use("/api/users", user_default);
  app.use("/api/admin/stats", stats_default);
  app.use("/api/upload", upload_default);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
var import_express12, import_helmet, import_cors, import_cookie_parser, import_mongoose13;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    import_express12 = __toESM(require("express"));
    import_helmet = __toESM(require("helmet"));
    import_cors = __toESM(require("cors"));
    import_cookie_parser = __toESM(require("cookie-parser"));
    import_mongoose13 = __toESM(require("mongoose"));
    init_cors();
    init_config();
    init_rateLimit();
    init_notFound();
    init_errorHandler();
    init_auth3();
    init_product2();
    init_category2();
    init_order2();
    init_payment();
    init_wishlist();
    init_coupon2();
    init_review2();
    init_user();
    init_stats();
    init_upload();
  }
});

// ../api/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => handler
});
module.exports = __toCommonJS(server_exports);
var import_mongoose14 = __toESM(require("mongoose"));
var MONGODB_URI = process.env.MONGODB_URI;
var cached = global.__mongoose_cache;
if (!cached) {
  cached = global.__mongoose_cache = { conn: null, promise: null };
}
async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = import_mongoose14.default.connect(MONGODB_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
var appPromise = null;
async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { createApp: createApp2 } = await Promise.resolve().then(() => (init_app(), app_exports));
      return createApp2();
    })();
  }
  return appPromise;
}
async function handler(req, res) {
  try {
    await connectDB();
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("[Vercel API] Error:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ success: false, message: "Internal server error" }));
  }
}
