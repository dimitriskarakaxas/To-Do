import TodoApp from "@/components/TodoApp";

export default function Home() {
  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-50 dark:bg-black px-4 py-12 sm:py-20">
      <TodoApp />
    </main>
  );
}
