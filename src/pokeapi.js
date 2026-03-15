import fs from "fs/promises"
import fetch from "node-fetch"
import path from "path"

export class WebBuilder {

    static VALID_GENERATIONS = ["generation-v", "generation-vi"]

    static STAT_TO_INDEX_MAP = {
        "hp": 0,
        "attack": 1,
        "defense": 2,
        "special-attack": 3,
        "special-defense": 4,
        "speed": 5
    }

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

    static formalizeAbilities(str) {
        let words = str.split("-")
        const formatted = words.map(word => this.capitalizeFirstLetter(word));
        return formatted.join(' ')
    }

    static checkForStatChanges(data) {
        let results = []
        if (data.length != 0) {
            data.forEach(entry => {
                if (this.VALID_GENERATIONS.includes(entry.generation.name)) {
                    const stats = entry.stats.reduce((acc, s) => {
                        acc[s.stat.name] = s.base_stat;
                        return acc;
                    }, {})
                    results.push(stats)
                }
                return results
            });
        }
        return results;
    }

    static checkForTypeChanges(data) {
        let results = []
        if (data.length != 0) {
            data.forEach(entry => {
                if (this.VALID_GENERATIONS.includes(entry.generation.name)) {
                    const types = entry.types.map(t => t.type.name)
                    results = types
                }
            });
        }
        return results;
    }

    static async buildPokemonFromAPI() {

        const outPath = path.join(process.cwd(), "output", "pokemon.json")
        const currentRange = Array.from({ length: 50 }, (_, i) => i + 1)
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
            const stats = data.stats.map(s => s.base_stat)
            let types = data.types.map(t => this.capitalizeFirstLetter(String(t.type.name)))

            const statsFromPastGeneration = this.checkForStatChanges(data.past_stats)
            if (statsFromPastGeneration.length > 0) {
                statsFromPastGeneration.forEach(stat => {
                    const [key, value] = Object.entries(stat)[0];
                    const index = this.STAT_TO_INDEX_MAP[key]
                    const previousValue = stats[index]
                    stats[index] = value
                    console.log(speciesName + " had " + key + " changed after Generation 4. Changed back to " + value + " from " + previousValue + ".")
                });
            }

            const typesFromPastGeneration = this.checkForTypeChanges(data.past_types)
            if (typesFromPastGeneration.length > 0) {
                let previousTypes = types
                types = typesFromPastGeneration.map(t => this.capitalizeFirstLetter((String(t))))
                console.log(speciesName + " had types changed after Generation 4. Changed back to " + types + " from " + previousTypes)
            }

            const formatted = {
                name: speciesName,
                dex: data.id,
                stats: stats,
                type: types,
                abilities: data.abilities.map(a => this.formalizeAbilities(String(a.ability.name))),
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