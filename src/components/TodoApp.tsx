"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import ThemeToggle from "./ThemeToggle";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  tags: string[];
};

type Filter = "all" | "active" | "done";

const STORAGE_KEY = "todo-app:items";

const TAG_REGEX = /#([a-zA-Z0-9_-]+)/g;

function parseTags(input: string): { text: string; tags: string[] } {
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = TAG_REGEX.exec(input)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  const text = input.replace(TAG_REGEX, "").replace(/\s+/g, " ").trim();
  return { text, tags: [...tags] };
}

export default function TodoApp() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY, []);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const remaining = useMemo(
    () => todos.filter((t) => !t.done).length,
    [todos],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const t of todos) for (const tag of t.tags ?? []) set.add(tag);
    return [...set].sort();
  }, [todos]);

  const visible = useMemo(() => {
    return todos.filter((t) => {
      if (filter === "active" && t.done) return false;
      if (filter === "done" && !t.done) return false;
      if (tagFilter && !(t.tags ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [todos, filter, tagFilter]);

  function addTodo(e: FormEvent) {
    e.preventDefault();
    const { text, tags } = parseTags(draft);
    if (!text && tags.length === 0) return;
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
        tags,
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
            Saved in your browser. Tag items with{" "}
            <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 text-xs">
              #tag
            </code>
            .
          </p>
        </div>
        <ThemeToggle />
      </header>

      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          aria-label="New todo"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Buy milk #shopping"
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <button
          type="submit"
          disabled={!parseTags(draft).text}
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

      {allTags.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">
            Tags:
          </span>
          {allTags.map((tag) => {
            const active = tagFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setTagFilter(active ? null : tag)}
                aria-pressed={active}
                className={`text-xs rounded-full px-2 py-0.5 transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {todos.length === 0
              ? "Nothing yet — add your first task."
              : "No items match this filter."}
          </li>
        ) : (
          visible.map((t) => {
            const tags = t.tags ?? [];
            return (
              <li
                key={t.id}
                className="flex items-start gap-3 px-4 py-3 group"
              >
                <input
                  id={`todo-${t.id}`}
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle(t.id)}
                  className="size-4 mt-1 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`todo-${t.id}`}
                    className={`block cursor-pointer select-none break-words ${
                      t.done ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                    }`}
                  >
                    {t.text}
                  </label>
                  {tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag)}
                          className="text-[11px] rounded-full bg-zinc-100 text-zinc-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 px-1.5 py-0.5 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  aria-label={`Delete ${t.text}`}
                  className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity mt-0.5"
                >
                  ×
                </button>
              </li>
            );
          })
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
