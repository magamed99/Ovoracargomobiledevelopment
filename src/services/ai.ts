import { Trip, Location } from '../types';

class AIService {
  async suggestPrice(from: Location, to: Location, date: string): Promise<number> {
    // Simulate AI price calculation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple distance-based calculation
    const distance = this.calculateDistance(from, to);
    const basePrice = 50; // Base price in TJS
    const pricePerKm = 0.5; // TJS per km
    
    return Math.round(basePrice + distance * pricePerKm);
  }

  async suggestRoutes(from: Location, to: Location): Promise<Trip[]> {
    // Simulate AI route suggestions
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [];
  }

  async chatWithAssistant(message: string, context?: any): Promise<string> {
    // Simulate AI chat
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const responses: Record<string, string> = {
      'цена': 'Рекомендуемая цена для вашей поездки: 150-200 TJS. Это основано на расстоянии и текущих рыночных ценах.',
      'маршрут': 'Лучший маршрут: Душанбе → Худжанд через трассу М34. Примерное время в пути: 5 часов.',
      'документы': 'Для регистрации водителем необходимы: паспорт, водительское удостоверение и техпаспорт автомобиля.',
      'безопасность': 'Все водители проходят верификацию документов. Используйте чат для общения с пассажирами.',
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return 'Я могу помочь с ценами, маршрутами, документами и безопасностью. Задайте конкретный вопрос!';
  }

  async analyzeDocument(imageUrl: string, type: string): Promise<{
    valid: boolean;
    confidence: number;
    extractedData?: any;
  }> {
    // Simulate document analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      valid: true,
      confidence: 0.95,
      extractedData: {
        documentNumber: 'AA1234567',
        expiryDate: '2025-12-31',
      },
    };
  }

  private calculateDistance(from: Location, to: Location): number {
    const R = 6371;
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const aiService = new AIService();
