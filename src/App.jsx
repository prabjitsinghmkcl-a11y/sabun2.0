import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import { SiteProvider } from './context/SiteContext'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import OrderSent from './pages/OrderSent'
import Product from './pages/Product'
import Shop from './pages/Shop'
import AccountLogin from './pages/account/AccountLogin'
import Account, { AccountAddresses, AccountOrders, AccountOverview, AccountProfile } from './pages/account/Account'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AddProduct from './pages/admin/AddProduct'
import EditProduct from './pages/admin/EditProduct'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="section"><div className="container">Loading...</div></div>
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <ProductsProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="product/:id" element={<Product />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="order-sent" element={<OrderSent />} />
                  <Route path="account/login" element={<AccountLogin />} />
                  <Route path="account" element={<Account />}>
                    <Route index element={<AccountOverview />} />
                    <Route path="orders" element={<AccountOrders />} />
                    <Route path="addresses" element={<AccountAddresses />} />
                    <Route path="profile" element={<AccountProfile />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="admin/login" element={<AdminLogin />} />
                <Route
                  path="admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="edit-product/:id" element={<EditProduct />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ProductsProvider>
      </SiteProvider>
    </AuthProvider>
  )
}
