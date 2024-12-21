import { useForm } from "react-hook-form";
import { moves } from "../utils/constants";
import { GameCreationFormData } from "../utils/types";

const CreateGameForm = ({
  onSubmit,
}: {
  onSubmit: (data: GameCreationFormData) => void;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<GameCreationFormData>({
    defaultValues: { move: 0, stake: 0, p2Address: "", password: "" },
  });
  const selectedMove = watch("move");

  return (
    <form
      className="flex flex-col items-center justify-center my-20"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h1 className="text-4xl font-bold text-white mb-8">Create a new game</h1>
      <p className="mt-6 mb-1 text-white">Choose your move</p>
      <div className="flex justify-center my-2 gap-4 w-full">
        {moves.map((m, i) => (
          <kbd
            key={i}
            onClick={() => {
              setValue("move", i);
            }}
            className={`kbd cursor-pointer ${selectedMove === i ? "bg-primary text-white" : null}`}
          >
            {m}
          </kbd>
        ))}
      </div>
      <div className=" my-4">
        <label className="input input-bordered flex items-center w-96">
          <input
            type="number"
            {...register("stake", {
              valueAsNumber: true,
              required: true,
              min: 1,
            })}
            className="grow"
            placeholder="Enter Amount"
          />
          <kbd className="">wei</kbd>
        </label>
      </div>
      <div className="my-4">
        <label className="input input-bordered flex items-center w-96">
          <input
            type="text"
            {...register("p2Address", {
              required: true,
              minLength: 42,
              maxLength: 42,
              pattern: /^0x[a-fA-F0-9]{40}$/,
            })}
            className="grow"
            placeholder="Player 2 Address"
          />
          <div className="label">
            {errors.p2Address && (
              <span className="label-text-alt text-red-600">
                Invalid Address
              </span>
            )}
          </div>
        </label>
      </div>
      <div className=" my-4">
        <label className="input input-bordered flex items-center w-96">
          <input
            type="text"
            {...register("password", { required: true })}
            className="grow"
            placeholder="Password"
          />
          <kbd className="">🔑</kbd>
        </label>
      </div>
      <button
        disabled={!isValid}
        className="btn btn-primary mt-4 w-96"
        type="submit"
      >
        Create Game
      </button>
    </form>
  );
};

export default CreateGameForm;
