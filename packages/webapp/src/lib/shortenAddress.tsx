const DEFAULT_STARTING_LETTERS_NUMBER = 10;
const DEFAULT_END_LETTERS_NUMBER = 4;

export const shortenAddress = (
  address: string,
  start: number = DEFAULT_STARTING_LETTERS_NUMBER,
  end: number = DEFAULT_END_LETTERS_NUMBER,
) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};
