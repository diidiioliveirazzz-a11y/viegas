"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
}

interface CartItem extends ProductItem {
  quantity: number;
}

export default function StoreClient({
  products,
  isSignedIn,
}: {
  products: ProductItem[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const categories = ["Todos", "Ceras", "Pomadas", "Barba", "Shampoos"];

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setCheckoutError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({
            productId: id,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setCheckoutError(result.error ?? "Não foi possível reservar estes produtos.");
        return;
      }
      setOrderSuccess(true);
      setCart([]);
      router.refresh();
    } catch {
      setCheckoutError("Erro de ligação. Confirma a ligação e tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Category Tabs & Cart Button */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCart(true)}
          className="relative px-5 py-2.5 bg-zinc-900 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-2"
        >
          <span>🛒 Carrinho</span>
          {cart.length > 0 && (
            <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded-full text-[10px] font-black">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Grid of Products */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition flex flex-col justify-between"
          >
            <div>
              <div className="h-48 rounded-xl overflow-hidden mb-4 bg-zinc-950 relative">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">💈</div>
                )}
                <span className="absolute bottom-2 right-2 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-400 font-semibold border border-zinc-800">
                  Stock: {p.stock}
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">{p.name}</h3>
              <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{p.description}</p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xl font-black text-amber-500">{p.price.toFixed(2)}€</span>
                <span className="text-[10px] text-zinc-500 uppercase">{p.category}</span>
              </div>

              <button
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="w-full py-2.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
              >
                {p.stock > 0 ? "+ Adicionar ao Carrinho" : "Esgotado"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal do Carrinho */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">O Teu Carrinho</h3>
              <button onClick={() => setShowCart(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {orderSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-4xl">🎉</div>
                <h4 className="text-lg font-bold text-white">Reserva registada!</h4>
                <p className="text-xs text-zinc-400">
                  O Diogo já consegue ver os produtos e quantidades no painel. A reserva fica pronta para pagamento e levantamento presencial na Viegas Barber.
                </p>
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                    setShowCart(false);
                  }}
                  className="mt-4 px-6 py-2.5 bg-amber-500 text-black text-xs font-bold rounded-xl"
                >
                  Concluir
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500 text-sm">O teu carrinho está vazio.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!isSignedIn && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    Inicia sessão para associar a reserva ao teu nome e o Diogo saber quem a fez.{" "}
                    <Link href="/login" className="font-bold underline">
                      Entrar
                    </Link>
                  </div>
                )}
                {checkoutError && (
                  <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    {checkoutError}
                  </p>
                )}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-zinc-500">
                          {item.quantity}x {item.price.toFixed(2)}€
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-500">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-400">Total Previsto:</span>
                  <span className="text-2xl font-black text-amber-500">{totalCart.toFixed(2)}€</span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
                  ℹ️ <strong>Pagamento ao balcão:</strong> Os produtos são reservados para entrega e pagamento presencial durante a tua visita à barbearia.
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!isSignedIn || submitting}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "A registar reserva..." : "Confirmar reserva de produtos"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
