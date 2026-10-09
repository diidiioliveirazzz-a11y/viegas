"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type HairStyle = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string;
  likes: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
};

type CatalogSection = "styles" | "products";
type Draft = {
  title: string;
  category: string;
  description: string;
  price: string;
  stock: string;
};

const blankDraft: Draft = {
  title: "",
  category: "",
  description: "",
  price: "",
  stock: "0",
};

async function compressImage(file: File): Promise<File> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("A fotografia original não pode ultrapassar 15 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a fotografia.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.68, 0.52]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= 900 * 1024) {
        return new File([blob], "fotografia.webp", { type: "image/webp" });
      }
    }
    throw new Error("A fotografia continua demasiado grande depois da compressão.");
  } finally {
    bitmap.close();
  }
}

export default function CatalogClient({
  initialStyles,
  initialProducts,
}: {
  initialStyles: HairStyle[];
  initialProducts: Product[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<CatalogSection>("styles");
  const [styles, setStyles] = useState(initialStyles);
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isStyle = section === "styles";
  const endpoint = isStyle ? "/api/admin/hair-styles" : "/api/admin/products";

  function openNew() {
    setDraft(blankDraft);
    setEditingId(null);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
    setFormOpen(true);
  }

  function openEdit(item: HairStyle | Product) {
    const style = "title" in item;
    setDraft({
      title: style ? item.title : item.name,
      category: item.category,
      description: item.description ?? "",
      price: style ? "" : String(item.price),
      stock: style ? "0" : String(item.stock),
    });
    setEditingId(item.id);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
    setFormOpen(true);
  }

  function changeSection(value: CatalogSection) {
    setSection(value);
    setFormOpen(false);
    setError("");
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set(isStyle ? "title" : "name", draft.title.trim());
      formData.set("category", draft.category.trim());
      formData.set("description", draft.description.trim());
      if (!isStyle) {
        formData.set("price", draft.price);
        formData.set("stock", draft.stock);
      }

      const selectedFile = fileInput.current?.files?.[0];
      if (selectedFile) formData.set("image", await compressImage(selectedFile));
      if (isStyle && !editingId && !selectedFile) {
        throw new Error("Seleciona uma fotografia para o corte.");
      }

      const response = await fetch(
        editingId ? `${endpoint}/${editingId}` : endpoint,
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const result = (await response.json()) as {
        style?: HairStyle;
        product?: Product;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível guardar.");

      if (result.style) {
        setStyles((current) =>
          editingId
            ? current.map((item) => item.id === editingId ? result.style! : item)
            : [result.style!, ...current],
        );
      }
      if (result.product) {
        setProducts((current) =>
          editingId
            ? current.map((item) => item.id === editingId ? result.product! : item)
            : [result.product!, ...current],
        );
      }
      setFormOpen(false);
      setEditingId(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro de ligação.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string, label: string) {
    if (!window.confirm(`Eliminar "${label}"? Esta ação não pode ser anulada.`)) return;
    setError("");
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível eliminar.");
      if (isStyle) setStyles((current) => current.filter((item) => item.id !== id));
      else setProducts((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro de ligação.");
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500";

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">Gestão da barbearia</p>
          <h1 className="mt-2 text-3xl font-black text-white">Catálogo e stock</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Atualiza as fotografias da galeria, os produtos da loja e as unidades disponíveis.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500"
        >
          {isStyle ? "+ Adicionar corte" : "+ Adicionar produto"}
        </button>
      </div>

      <div className="mt-7 flex gap-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => changeSection("styles")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${isStyle ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Galeria ({styles.length})
        </button>
        <button
          type="button"
          onClick={() => changeSection("products")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${!isStyle ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Produtos e stock ({products.length})
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:grid-cols-2 sm:p-6"
        >
          <h2 className="sm:col-span-2 text-lg font-bold text-white">
            {editingId ? "Editar" : "Novo"} {isStyle ? "corte da galeria" : "produto"}
          </h2>
          <label className="text-xs font-semibold text-zinc-400">
            {isStyle ? "Título do corte *" : "Nome do produto *"}
            <input
              required
              maxLength={100}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={`${fieldClass} mt-2`}
              placeholder={isStyle ? "Ex.: Mid Fade" : "Ex.: Pomada Matte"}
            />
          </label>
          <label className="text-xs font-semibold text-zinc-400">
            Categoria *
            <input
              required
              maxLength={60}
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              className={`${fieldClass} mt-2`}
              placeholder={isStyle ? "Ex.: Mid Fade" : "Ex.: Ceras"}
            />
          </label>
          {!isStyle && (
            <>
              <label className="text-xs font-semibold text-zinc-400">
                Preço (€) *
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="text-xs font-semibold text-zinc-400">
                Unidades em stock *
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={draft.stock}
                  onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
                  className={`${fieldClass} mt-2`}
                />
              </label>
            </>
          )}
          <label className="text-xs font-semibold text-zinc-400 sm:col-span-2">
            Descrição
            <textarea
              maxLength={500}
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className={`${fieldClass} mt-2`}
              placeholder="Descrição opcional"
            />
          </label>
          <label className="text-xs font-semibold text-zinc-400 sm:col-span-2">
            Fotografia {isStyle && !editingId ? "*" : ""}
            <input
              ref={fileInput}
              required={isStyle && !editingId}
              type="file"
              accept="image/*"
              className={`${fieldClass} mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-red-500/15 file:px-3 file:py-2 file:font-semibold file:text-red-300`}
            />
            <span className="mt-1 block font-normal text-zinc-500">
              A imagem é otimizada e guardada na base de dados. Máximo original: 15 MB.
            </span>
          </label>
          <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => { setFormOpen(false); setError(""); }}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {isStyle ? (
        styles.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {styles.map((style) => (
              <article key={style.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <img src={style.imageUrl} alt={style.title} className="h-52 w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400">{style.category}</p>
                  <h3 className="mt-1 font-bold text-white">{style.title}</h3>
                  {style.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{style.description}</p>}
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => openEdit(style)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">Editar</button>
                    <button type="button" onClick={() => deleteItem(style.id, style.title)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10">Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">Ainda não há cortes na galeria. Adiciona a primeira fotografia.</p>
        )
      ) : products.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-zinc-950 text-5xl">💈</div>
              )}
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-400">{product.category}</p>
                <h3 className="mt-1 font-bold text-white">{product.name}</h3>
                {product.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{product.description}</p>}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-white">{product.price.toFixed(2)} €</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                    {product.stock} {product.stock === 1 ? "unidade" : "unidades"}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => openEdit(product)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">Editar / stock</button>
                  <button type="button" onClick={() => deleteItem(product.id, product.name)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10">Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">Ainda não há produtos. Adiciona o primeiro para o mostrar na loja.</p>
      )}
    </div>
  );
}
