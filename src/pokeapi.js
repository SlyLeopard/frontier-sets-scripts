import fs from "fs/promises"
import fetch from "node-fetch"
import path from "path"

export class WebBuilder {

    static async fetchWithDelay(url, delay = 100) {

        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            if (delay > 0) await new Promise(r => setTimeout(r, delay))
            return data
        } catch (err) {
            console.error(`Error fetching ${url}:`, err)
            return null
        }

    }

    static capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static async buildPokemonFromAPI() {

        const outPath = path.join(process.cwd(), "output", "pokemon.json")
        const currentRange = Array.from({ length: 1 }, (_, i) => i + 1)
        const allPokemon = []
        let existingData = []

        for (const id of currentRange) {

            try {
                const raw = await fs.readFile(outPath, "utf-8")
                existingData = JSON.parse(raw)
            } catch (err) {
                if (err.code !== "ENOENT") throw err // ignore if file doesn't exist
            }

            const url = `https://pokeapi.co/api/v2/pokemon/${id}`
            const data = await this.fetchWithDelay(url, 100) // 100ms delay between calls
            if (!data) continue
            const speciesName = this.capitalizeFirstLetter(String(data.name))

            const formatted = {
                name: speciesName,
                dex: data.id,
                stats: data.stats.map(s => s.base_stat),
                types: data.types.map(t => this.capitalizeFirstLetter(String(t.type.name))),
                abilities: data.abilities.map(a => this.capitalizeFirstLetter(String(a.ability.name))),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            allPokemon.push(formatted)
            console.log(`Fetched ${speciesName} (${data.id})`)
        }

        existingData.push(...allPokemon)
        await fs.mkdir(path.dirname(outPath), { recursive: true })
        await fs.writeFile(outPath, JSON.stringify(existingData, null, 2))
        console.log("All Pokémon saved to", outPath)
    }

}