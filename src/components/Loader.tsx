const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto h-screen ">
      <span className="loading loading-spinner loading-lg text-white"></span>
    </div>
  );
};

export const InLineLoader = () => {
  return (
    <span className="loading loading-spinner loading-lg text-white"></span>
  );
};

export default Loader;
