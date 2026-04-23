import logoUrl from "../svg/safraLogo.svg";
import iconUrl from "../svg/safraIcon.svg";

export function Logo({ size = 120, variant = "logo", style, alt = "ספרא" }) {
  const src = variant === "icon" ? iconUrl : logoUrl;
  return (
    <img
      src={src}
      alt={alt}
      style={{
        height: size,
        width: "auto",
        display: "block",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}

export default Logo;
