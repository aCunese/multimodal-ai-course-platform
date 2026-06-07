import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

import { Icon } from "./Icon";
import type { IconName, StatusTone } from "../types/platform";

type ButtonProps = PropsWithChildren<
  {
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>
>;

export function Button({
  children,
  variant = "primary",
  icon,
  className = "",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      type={type}
      {...buttonProps}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </button>
  );
}

type StatusBadgeProps = PropsWithChildren<{
  tone?: StatusTone;
}>;

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

type PanelProps = PropsWithChildren<{
  title?: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
  id?: string;
}>;

export function Panel({ title, icon, action, className = "", children, id }: PanelProps) {
  return (
    <section id={id} className={`panel ${className}`.trim()}>
      {title ? (
        <header className="panel__header">
          <div className="panel__title-wrap">
            {icon ? (
              <span className="panel__icon">
                <Icon name={icon} size={18} />
              </span>
            ) : null}
            <h2 className="panel__title">{title}</h2>
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
