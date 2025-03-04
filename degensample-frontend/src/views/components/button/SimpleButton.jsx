 

function Main(props) {
  // Define color classes
  const colorClasses = {
    primary: "bg-primary text-white border-primary hover:bg-primary/90",
    secondary: "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300",
    success: "bg-success text-white border-success hover:bg-success/90",
    warning: "bg-warning text-white border-warning hover:bg-warning/90",
    danger: "bg-danger text-white border-danger hover:bg-danger/90",
    info: "bg-blue-500 text-white border-blue-500 hover:bg-blue-600",
    white: "bg-white text-primary border-white hover:bg-white/90",
    none: "", // No styling, allows complete customization via className
    default: "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
  };
  
  // Get color class based on prop or default
  const colorClass = colorClasses[props.color] || colorClasses.default;
  
  // Handle loading state
  const isLoading = props.isLoading === true;
  
  return (
    <button
      type={props.type || "button"}
      disabled={props.disabled || isLoading}
      className={`px-4 py-2 rounded-md border transition-colors flex items-center justify-center space-x-2 
                 ${colorClass} 
                 ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                 ${props.customClass || ''}
                 ${props.className || ''}`}
      onClick={props.onClick}
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
      ) : props.icon && (
        <span className="flex-shrink-0">{props.icon}</span>
      )}
      
      {props.label && <span>{props.label}</span>}
      {props.children}
    </button>
  );
}
/*
Main.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineColor: PropTypes.string,
  className: PropTypes.string,
};

Main.defaultProps = {
  width: "auto",
  height: "auto",
  lineColor: "",
  className: "",
};*/

export default Main;
