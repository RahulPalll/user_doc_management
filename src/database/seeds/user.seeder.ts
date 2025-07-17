import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums';

export class UserSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Clear existing data
    await userRepository.clear();

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(admin);

    // Create editor user
    const editorPassword = await bcrypt.hash('Editor123!', 12);
    const editor = userRepository.create({
      username: 'editor',
      email: 'editor@example.com',
      password: editorPassword,
      firstName: 'Content',
      lastName: 'Editor',
      role: UserRole.EDITOR,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(editor);

    // Create viewer user
    const viewerPassword = await bcrypt.hash('Viewer123!', 12);
    const viewer = userRepository.create({
      username: 'viewer',
      email: 'viewer@example.com',
      password: viewerPassword,
      firstName: 'Content',
      lastName: 'Viewer',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(viewer);

    console.log('Created 3 basic users: admin, editor, viewer');
  }
}
