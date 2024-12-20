import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="text-white text-center text-2xl">
        404 - Page Not Found
      </div>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        Go to Home
      </button>
    </div>
  );
};

export default NotFound;
