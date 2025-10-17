import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: (string | undefined | null | Record<string, boolean>)[]) =>
  twMerge(clsx(inputs));
