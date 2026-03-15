import fs from "fs"
import path from "path"
import { select } from "@inquirer/prompts"
import { WebBuilder } from './src/scrape.js'
import { TextBuilder } from './src/text.js'

const dataFolder = "./data"

const files = fs.readdirSync(dataFolder)

async function main() {
    const sourceType = await select(
        {
            message: "Where should the data come from?",
            choices: [
                { name: "Scrape from Web", value: "scrape" },
                { name: "Build from Text File", value: "text" },
            ],
        })

    let file;

    if (sourceType === "text") {
        file = await select({
            message: "Select a text file:",
            choices: files
        })
    }

    if (sourceType === "scrape") {
        await WebBuilder.buildPokemonFromAPI()
    } else {
        const filePath = path.join(dataFolder, file)

        switch (file) {
            case "trainers.txt":
                await TextBuilder.buildTrainerFromText(filePath)
                break
            case "pokemonSets.txt":
                await TextBuilder.buildPokemonSetFromText(filePath)
                break
            default:
                console.error("No builder defined for this file:", file)
        }
    }
}

await main()