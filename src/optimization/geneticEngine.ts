export interface DesignChromosome {
  genes: number[];
  fitness: number;
}

export interface OptimizationConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  fitnessFunction: (genes: number[]) => number;
}

export class GeneticEngine {
  private population: DesignChromosome[] = [];
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig, geneLength: number) {
    this.config = config;
    this.population = Array.from({ length: config.populationSize }, () => ({
      genes: Array.from({ length: geneLength }, () => Math.random()),
      fitness: 0,
    }));
  }

  private evaluate() {
    for (const individual of this.population) {
      individual.fitness = this.config.fitnessFunction(individual.genes);
    }
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  private crossover(a: DesignChromosome, b: DesignChromosome): DesignChromosome {
    const point = Math.floor(Math.random() * a.genes.length);
    return {
      genes: [...a.genes.slice(0, point), ...b.genes.slice(point)],
      fitness: 0,
    };
  }

  private mutate(individual: DesignChromosome) {
    for (let i = 0; i < individual.genes.length; i++) {
      if (Math.random() < this.config.mutationRate) {
        individual.genes[i] = Math.random();
      }
    }
  }

  run(): DesignChromosome {
    for (let gen = 0; gen < this.config.generations; gen++) {
      this.evaluate();
      const nextPop: DesignChromosome[] = this.population.slice(0, 2);

      while (nextPop.length < this.config.populationSize) {
        const parent1 = this.population[Math.floor(Math.random() * 10)];
        const parent2 = this.population[Math.floor(Math.random() * 10)];
        const child = this.crossover(parent1, parent2);
        this.mutate(child);
        nextPop.push(child);
      }
      this.population = nextPop;
    }
    this.evaluate();
    return this.population[0];
  }
}
