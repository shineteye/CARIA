export default function Button({ variant = 'gold', children, className = '', ...props }) {
  const variantClass = {
    gold: 'btn--gold',
    outline: 'btn--outline',
    navy: 'btn--navy',
  }[variant] || 'btn--gold';

  return (
    <button type="button" className={`btn ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
