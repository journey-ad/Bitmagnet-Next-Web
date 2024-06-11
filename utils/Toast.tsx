"use client";

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import clsx from "clsx";

import { $env } from "@/utils";

type ToastType = "info" | "success" | "warn" | "error";

interface ToastMessage {
  id: number;
  type: ToastType;
  content: string;
  duration: number;
}

interface ToastProps {
  messages: ToastMessage[];
  removeMessage: (id: number) => void;
}

const iconMap = {
  info: (
    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:bg-blue-800 dark:text-blue-200">
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
      </svg>
    </div>
  ),
  success: (
    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
      </svg>
    </div>
  ),
  warn: (
    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-orange-300 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
      </svg>
    </div>
  ),
  error: (
    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
      </svg>
    </div>
  ),
};

const ToastContainer: React.FC<ToastProps> = ({ messages, removeMessage }) => {
  const [removingMessages, setRemovingMessages] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    setRemovingMessages((prev) => [...prev, id]);
    setTimeout(() => removeMessage(id), 300); // 300ms matches the fade-out duration
  };

  useEffect(() => {
    messages.forEach((message) => {
      setTimeout(() => handleRemove(message.id), message.duration);
    });
  }, [messages]);

  return (
    <div className="fixed top-[5vh] left-0 right-0 flex flex-col items-center p-4 mb-4 pointer-events-none z-20">
      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            "flex items-center w-full max-w-xs px-3 py-2 mb-3 text-gray-500 bg-white rounded-lg shadow bg-opacity-90 dark:text-gray-400 dark:bg-gray-800",
            {
              "animate-fade-out": removingMessages.includes(message.id),
              "animate-fade-in-up": !removingMessages.includes(message.id),
            },
          )}
          role="alert"
        >
          {iconMap[message.type]}
          <div className="ps-3 text-sm font-normal ml-3 border-l border-l-gray-200 dark:border-l-gray-700">
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
};

let toastId = 0;
let toastRoot: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

setTimeout(() => {
  if ($env.isServer) return;

  toastRoot =
    document.querySelector(".__toast-container") ||
    document.createElement("div");
  toastRoot.className = "__toast-container";
  toastRoot.style.zIndex = "10001";

  document.body.appendChild(toastRoot);
  root = createRoot(toastRoot);
}, 0);

export const Toast = {
  messages: [] as ToastMessage[],
  setMessages(messages: ToastMessage[]) {
    this.messages = messages;
    root.render(
      <ToastContainer
        messages={this.messages}
        removeMessage={this.removeMessage.bind(this)}
      />,
    );
  },
  show(type: ToastType, content: string, duration = 2000) {
    const id = toastId++;
    const newMessage: ToastMessage = { id, type, content, duration };

    const list = [newMessage, ...this.messages].splice(0, 5);

    this.setMessages(list);
  },
  removeMessage(id: number) {
    this.setMessages(this.messages.filter((message) => message.id !== id));
  },
  info(content: string, duration?: number) {
    this.show("info", content, duration);
  },
  success(content: string, duration?: number) {
    this.show("success", content, duration);
  },
  warn(content: string, duration?: number) {
    this.show("warn", content, duration);
  },
  error(content: string, duration?: number) {
    this.show("error", content, duration);
  },
};
