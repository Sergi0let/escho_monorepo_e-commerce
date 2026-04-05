import ShellLayout from "@/ShellLayout";
import CategoriesPage from "@/pages/CategoriesPage";
import HomePage from "@/pages/HomePage";
import PaymentsPage from "@/pages/PaymentsPage";
import ProductsPage from "@/pages/ProductsPage";
import UserDetailPage from "@/pages/UserDetailPage";
import UsersPage from "@/pages/UsersPage";
import { Route, Routes, useParams } from "react-router-dom";

/** У Next-версії не було окремої сторінки товару — заглушка для посилань з таблиці. */
function ProductDetailStub() {
  const { id } = useParams();
  return (
    <div className="bg-secondary mt-4 rounded-md p-4 text-sm">
      Картка товару (мок), id: {id}. У прикладі Next окремої сторінки не було.
    </div>
  );
}

export default function App() {
  return (
    <ShellLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products/:id" element={<ProductDetailStub />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </ShellLayout>
  );
}
