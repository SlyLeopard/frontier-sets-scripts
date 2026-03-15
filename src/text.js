import fs from "fs/promises";
import path from "path";

export class TextBuilder {
    static async buildTrainerFromText(filePath) {
        try {
            let resultingJson = []

            const data = await fs.readFile(filePath, "utf-8");
            const lines = data.split("\n");

            lines.forEach(line => {
                const entry = line.split(" ").map(field => field.trim())
                const rank = parseInt(entry[3], 10)
                const result = {
                    job: entry[1],
                    name: entry[2],
                    rank: rank,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
                resultingJson.push(result)
            });

            console.log(resultingJson)

            const outPath = path.join(process.cwd(), "output/trainers.json");
            await fs.writeFile(outPath, JSON.stringify(resultingJson, null, 2));
            console.log("JSON written to", outPath);
        } catch (err) {
            console.error("Error reading or writing file:", err);
        }
    }

    static async buildPokemonSetFromText(filePath) {
        try {

            let resultingJson = []
            let setCountMap = new Map()

            const data = await fs.readFile(filePath, "utf-8");
            const lines = data.split("\n");

            lines.forEach(line => {
                const entry = line.split("|")
                const species = entry[1]
                if(setCountMap.has(species)) {
                    setCountMap.set(species, setCountMap.get(species) + 1)
                } else {
                    setCountMap.set(species, 1)
                }

                const name = species + " " + setCountMap.get(species)
                const rank = parseInt(entry[2], 10)
                const moves = [entry[4], entry[5], entry[6], entry[7]]
                const evs = [entry[10], entry[11], entry[12], entry[13], entry[14], entry[15]]
                const result = {
                    name: String(name).replace("_", " "),
                    species: String(species).replace("_", " "),
                    ev: evs,
                    moves: moves,
                    nature: entry[9],
                    item: entry[8],
                    rank: rank,
                    generation: 4,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                resultingJson.push(result)
            });

            console.log(resultingJson)

            const outPath = path.join(process.cwd(), "output/pokemonSet.json");
            await fs.writeFile(outPath, JSON.stringify(resultingJson, null, 2));
            console.log("JSON written to", outPath);

        } catch (err) {
            console.error("Error reading or writing file:", err);
        }
    }

}