import { writeFile } from "node:fs";

export const saveAsJson = async (array: object[]) => {
  await writeFile("data/json/", JSON.stringify(array, null, 2), (error) => {
    console.log(error);
  });
};
