import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("books", "routes/books.tsx"),
	route("checkout", "routes/checkout.tsx"),
	route("checkin", "routes/checkin.tsx"),
	route("fines", "routes/fines.tsx"),
] satisfies RouteConfig;
