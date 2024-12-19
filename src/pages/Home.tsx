import { useNavigate } from "react-router-dom";
import { FaPlus, FaSignInAlt } from "react-icons/fa"; // Optional: Icons for better UX

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-12">
        Welcome to the RPS Game Portal
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-80 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="p-6 text-center">
            <FaPlus className="text-indigo-500 w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Create Game</h2>
            <p className="text-gray-600 mb-6">
              Start a new game session and invite your friend to join.
            </p>
            <button
              className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center"
              onClick={() => navigate("/create")}
              aria-label="Create a new game"
            >
              <FaPlus className="mr-2" /> Create Game
            </button>
          </div>
        </div>

        <div className="w-80 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <div className="p-6 text-center">
            <FaSignInAlt className="text-indigo-500 w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Join Game</h2>
            <p className="text-gray-600 mb-6">
              Enter a game code to join an existing game session.
            </p>
            <button
              className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center"
              onClick={() => navigate("/join")}
              aria-label="Join an existing game"
            >
              <FaSignInAlt className="mr-2" /> Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
