import { PaginationDto } from './pagination.dto';
import { validate } from 'class-validator';

describe('PaginationDto', () => {
  it('should create a pagination DTO with default values', () => {
    const dto = new PaginationDto();

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.skip).toBe(0);
  });

  it('should calculate skip correctly', () => {
    const dto = new PaginationDto();
    dto.page = 3;
    dto.limit = 20;

    expect(dto.skip).toBe(40);
  });

  it('should allow valid page and limit values', async () => {
    const dto = new PaginationDto();
    dto.page = 2;
    dto.limit = 25;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid page values', async () => {
    const dto = new PaginationDto();
    dto.page = 0;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid limit values', async () => {
    const dto = new PaginationDto();
    dto.limit = 0;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
