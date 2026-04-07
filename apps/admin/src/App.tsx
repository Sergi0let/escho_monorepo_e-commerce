import ShellLayout from "@/ShellLayout";
import CategoriesPage from "@/pages/CategoriesPage";
import HomePage from "@/pages/HomePage";
import PaymentsPage from "@/pages/PaymentsPage";
import ProductEditPage from "@/pages/ProductEditPage";
import ProductsPage from "@/pages/ProductsPage";
import UserDetailPage from "@/pages/UserDetailPage";
import UsersPage from "@/pages/UsersPage";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <ShellLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products/:id" element={<ProductEditPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </ShellLayout>
  );
}
