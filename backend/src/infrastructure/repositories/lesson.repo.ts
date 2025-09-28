// filesystem + caché

import fs from 'fs';
import path from 'path';
import { Lesson } from '../../core/models/index';
import { LessonAdapter } from '../../core/adapters/lesson.adapter';

export class LessonRepo {
  private cache = new Map<string, Lesson>();
  private lessonsPath: string;

  constructor(lessonsPath: string = './data/lessons') {
    this.lessonsPath = lessonsPath;
  }

  async getById(id: string): Promise<Lesson> {
    // Verificar caché primero
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Resolver ruta del archivo
    const filePath = this.resolveLessonPath(id);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Lesson not found: ${id}`);
    }

    // Leer y parsear JSON → valida contra schema.lesson.json (si lo usas) → cache en memoria
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const lessonData = JSON.parse(rawData);

    // Normalizar con el adaptador
    const lesson = LessonAdapter.normalize(lessonData);
    
    // Guardar en caché
    this.cache.set(id, lesson);
    
    return lesson;
  }

  async listByCourse(course: string): Promise<Lesson[]> {
    // opcional (lee index.json o lista carpetas)
    const coursePath = path.join(this.lessonsPath, course);
    
    if (!fs.existsSync(coursePath)) {
      return [];
    }

    const files = fs.readdirSync(coursePath, { recursive: true })
      .filter(file => typeof file === 'string' && file.endsWith('.json'))
      .map(file => path.join(coursePath, file as string));

    const lessons: Lesson[] = [];
    
    for (const file of files) {
      try {
        const rawData = fs.readFileSync(file, 'utf-8');
        const lessonData = JSON.parse(rawData);
        const lesson = LessonAdapter.normalize(lessonData);
        lessons.push(lesson);
      } catch (error) {
        console.error(`Error loading lesson from ${file}:`, error);
      }
    }

    return lessons;
  }

  private resolveLessonPath(id: string): string {
    // Convertir "mineria/iperc/lesson01" a "./data/lessons/mineria/iperc/lesson01.json"
    const parts = id.split('/');
    const fileName = parts[parts.length - 1];
    const coursePath = parts.slice(0, -1).join('/');
    
    return path.join(this.lessonsPath, coursePath, `${fileName}.json`);
  }
}
