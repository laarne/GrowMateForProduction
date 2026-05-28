const USER_INPUT_START = "<user_input>";
const USER_INPUT_END = "</user_input>";

export function wrapUserInputForPrompt(value: string) {
  return `${USER_INPUT_START}\n${value}\n${USER_INPUT_END}`;
}

export function unwrapDelimitedUserInput(value: string) {
  const startIndex = value.indexOf(USER_INPUT_START);
  const endIndex = value.lastIndexOf(USER_INPUT_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return value;
  }

  return value.slice(startIndex + USER_INPUT_START.length, endIndex).trim();
}
