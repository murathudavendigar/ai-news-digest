"use client";

import Link from "next/link";
import { useState } from "react";

const categories = [
  { slug: "technology", title: "Teknoloji", icon: "💻" },
  { slug: "sports", title: "Spor", icon: "⚽" },
  { slug: "business", title: "Ekonomi", icon: "💼" },
  { slug: "health", title: "Sağlık", icon: "🏥" },
  { slug: "entertainment", title: "Magazin", icon: "🎬" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-700 dark:text-gray-300">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          href="/"
          className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
          Anasayfa
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1">
            <span>{cat.icon}</span>
            <span>{cat.title}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium">
              🏠 Anasayfa
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
