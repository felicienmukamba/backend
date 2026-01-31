import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('HR Module (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Apply same validation as main.ts
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );

        await app.init();

        // Login to get auth token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'password123',
            });

        authToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/hr/employees (GET)', () => {
        it('should return paginated employees', () => {
            return request(app.getHttpServer())
                .get('/api/hr/employees?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data).toHaveProperty('data');
                    expect(res.body.data).toHaveProperty('meta');
                    expect(Array.isArray(res.body.data.data)).toBe(true);
                });
        });

        it('should filter by search query', () => {
            return request(app.getHttpServer())
                .get('/api/hr/employees?search=John')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('/api/hr/employees (POST)', () => {
        it('should create a new employee', () => {
            return request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@test.com',
                    baseSalary: 5000,
                    hireDate: new Date().toISOString(),
                    isActive: true,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data).toHaveProperty('id');
                });
        });

        it('should validate required fields', () => {
            return request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'J', // Too short
                    lastName: 'Doe',
                })
                .expect(400);
        });

        it('should reject invalid email', () => {
            return request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'invalid-email',
                    baseSalary: 5000,
                    hireDate: new Date().toISOString(),
                })
                .expect(400);
        });
    });

    describe('/api/hr/employees/:id (GET)', () => {
        it('should return single employee', async () => {
            // First create an employee
            const createRes = await request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane.smith@test.com',
                    baseSalary: 6000,
                    hireDate: new Date().toISOString(),
                });

            const employeeId = createRes.body.data.id;

            return request(app.getHttpServer())
                .get(`/api/hr/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.id).toBe(employeeId);
                    expect(res.body.data.email).toBe('jane.smith@test.com');
                });
        });

        it('should return 404 for non-existent employee', () => {
            return request(app.getHttpServer())
                .get('/api/hr/employees/99999999-9999-9999-9999-999999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('/api/hr/employees/:id (PATCH)', () => {
        it('should update employee', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Update',
                    lastName: 'Test',
                    email: 'update.test@test.com',
                    baseSalary: 4000,
                    hireDate: new Date().toISOString(),
                });

            const employeeId = createRes.body.data.id;

            return request(app.getHttpServer())
                .patch(`/api/hr/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    baseSalary: 5500,
                    department: 'IT',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.baseSalary).toBe('5500');
                    expect(res.body.data.department).toBe('IT');
                });
        });
    });

    describe('/api/hr/employees/:id (DELETE)', () => {
        it('should delete employee', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Delete',
                    lastName: 'Test',
                    email: 'delete.test@test.com',
                    baseSalary: 3000,
                    hireDate: new Date().toISOString(),
                });

            const employeeId = createRes.body.data.id;

            return request(app.getHttpServer())
                .delete(`/api/hr/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
