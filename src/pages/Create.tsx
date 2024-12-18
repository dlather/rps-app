import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useForm } from "react-hook-form";
import { moves } from "../utils/constants";

type CreateGameForm = {
  move: number;
  stake: number;
  player2: string;
  pwd: string;
};

const Create = () => {
  const { isDisconnected } = useAccount();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateGameForm>({
    defaultValues: { move: 0, stake: 0, player2: "" },
  });

  const onSubmit = (data: CreateGameForm) => {
    console.log(data);
  };

  const selectedMove = watch("move");

  if (isDisconnected)
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <div className="text-lg mb-4">Please connect your wallet</div>
        <ConnectButton />
      </div>
    );

  return (
    <div>
      <form
        className="flex flex-col items-center justify-center my-20"
        onSubmit={handleSubmit(onSubmit)}
      >
        <p className="mt-6 mb-1 text-gray-500">Choose your move</p>
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
              {...register("player2", {
                required: true,
                minLength: 42,
                maxLength: 42,
                pattern: /^0x[a-fA-F0-9]{40}$/,
              })}
              className="grow"
              placeholder="Player 2 Address"
            />
            <div className="label">
              {errors.player2 && (
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
              {...register("pwd", { required: true })}
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
    </div>
  );
};

export default Create;
