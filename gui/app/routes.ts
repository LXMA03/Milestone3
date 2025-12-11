import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("books", "routes/books.tsx"),
	route("checkout", "routes/checkout.tsx"),
	route("checkin", "routes/checkin.tsx"),
	route("fines", "routes/fines.tsx"),
	route("librarian-login", "routes/LibrarianSide/librarian-login.tsx"),
	route("lib-fines", "routes/LibrarianSide/lib-fines.tsx"),
	] satisfies RouteConfig;
