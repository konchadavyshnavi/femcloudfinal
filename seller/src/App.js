import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import SellerProfilePage from "./pages/SellerProfilePage";
import SellerLogin from "./SellerLogin";
import Navbar from "./Navbar";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

const backendUrl = "http://localhost:4000/api/seller/product";

const ProtectedRoute = ({ token }) => {
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("sellerToken"));
  const [sellerId, setSellerId] = useState(localStorage.getItem("sellerId"));
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    whatsappNumber: "",
    sellerId: sellerId || "",
    image: [],
  });

  const fetchProducts = useCallback(async () => {
    if (!token || !sellerId) return;
    try {
      const res = await axios.post(
        `${backendUrl}/list/${sellerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, [token, sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onLogin = (tok, id) => {
    setToken(tok);
    setSellerId(id);
    localStorage.setItem("sellerToken", tok);
    localStorage.setItem("sellerId", id);
  };

  const onLogout = () => {
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("sellerId");
    setToken(null);
    setSellerId(null);
    setProducts([]);
    setEditingIndex(null);
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      whatsappNumber: "",
      sellerId: "",
      image: [],
    });
  };

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onEditProduct = (product, index) => {
    setEditingIndex(index);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      whatsappNumber: product.whatsappNumber || "",
      image: product.image || [],
      sellerId: sellerId,
    });
  };

  const onSubmitProduct = async (formData) => {
    try {
      await axios.post(`${backendUrl}/add`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingIndex(null);
      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        whatsappNumber: "",
        image: [],
        sellerId: sellerId,
      });
      fetchProducts();
    } catch (error) {
      console.error("Product save failed:", error.response?.data || error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const onDeleteProduct = async (index) => {
    try {
      const productId = products[index]._id;
      await axios.post(
        `${backendUrl}/delete`,
        { id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProducts();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <Router>
      {token && <Navbar onLogout={onLogout} />}
      <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={token ? "/products" : "/login"} replace />}
          />
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/products" replace />
              ) : (
                <SellerLogin onLogin={onLogin} />
              )
            }
          />
          <Route element={<ProtectedRoute token={token} />}>
            <Route
              path="/products"
              element={
                <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
                  <h1 className="text-3xl font-bold mb-6 text-gray-800">
                    Manage Products
                  </h1>
                  <ProductForm
                    form={form}
                    onChange={onChange}
                    onSubmit={onSubmitProduct}
                    onCancel={() => {
                      setEditingIndex(null);
                      setForm({
                        name: "",
                        description: "",
                        price: "",
                        category: "",
                        whatsappNumber: "",
                        image: [],
                        sellerId: sellerId,
                      });
                    }}
                    editing={editingIndex !== null}
                  />
                  <ProductList
                    products={products}
                    onEdit={onEditProduct}
                    onDelete={onDeleteProduct}
                  />
                </div>
              }
            />
            <Route path="/profile" element={<SellerProfilePage />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Route>
          <Route
            path="*"
            element={<Navigate to={token ? "/products" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
