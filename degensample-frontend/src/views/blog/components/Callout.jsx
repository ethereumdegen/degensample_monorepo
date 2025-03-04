const Main = (props) => {
  return (
    <div className="p-4 bg-gray-100 border-2 border-gray-200 m-4 rounded">
      {props.children}
    </div>
  );
};

export default Main;
