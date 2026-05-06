"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import ThemeToggle from "./ThemeToggle";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

type Filter = "all" | "active" | "done";

const STORAGE_KEY = "todo-app:items";

export default function TodoApp() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY, []);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const remaining = useMemo(
    () => todos.filter((t) => !t.done).length,
    [todos],
  );

  const visible = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "done") return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter]);

  function addTodo(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now() + Math.random()),
        text,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setDraft("");
  }

  function toggle(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">To-Do</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Saved in your browser. No account, no server.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          aria-label="New todo"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-zinc-900 text-white px-4 py-2 font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add
        </button>
      </form>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-zinc-500 dark:text-zinc-400">
          {remaining} {remaining === 1 ? "item" : "items"} left
        </span>
        <div className="flex gap-1" role="tablist" aria-label="Filter">
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                filter === f
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {todos.length === 0 ? "Nothing yet — add your first task." : "No items match this filter."}
          </li>
        ) : (
          visible.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3 group">
              <input
                id={`todo-${t.id}`}
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="size-4 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
              />
              <label
                htmlFor={`todo-${t.id}`}
                className={`flex-1 cursor-pointer select-none ${
                  t.done ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                }`}
              >
                {t.text}
              </label>
              <button
                onClick={() => remove(t.id)}
                aria-label={`Delete ${t.text}`}
                className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                ×
              </button>
            </li>
          ))
        )}
      </ul>

      {todos.some((t) => t.done) && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={clearCompleted}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Clear completed
          </button>
        </div>
      )}
    </div>
  );
}
