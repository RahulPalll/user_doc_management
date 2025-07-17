import { DataSource } from 'typeorm';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';

export class DocumentSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const documentRepository = this.dataSource.getRepository(Document);
    const userRepository = this.dataSource.getRepository(User);

    // Check if documents already exist
    const existingDocuments = await documentRepository.count();
    if (existingDocuments > 0) {
      console.log('Documents already exist, skipping seeding');
      return;
    }

    // Get the first user to assign documents to
    const user = await userRepository.findOne({ where: {} });
    if (!user) {
      console.log('No users found, cannot seed documents');
      return;
    }

    // Create sample documents
    const documents = [
      {
        title: 'Sample Document 1',
        filename: 'sample1.pdf',
        originalName: 'sample1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        content: 'This is a sample document for testing purposes.',
        uploadedBy: user,
      },
      {
        title: 'Sample Document 2',
        filename: 'sample2.docx',
        originalName: 'sample2.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
        content: 'Another sample document for the system.',
        uploadedBy: user,
      },
      {
        title: 'Sample Document 3',
        filename: 'sample3.txt',
        originalName: 'sample3.txt',
        mimeType: 'text/plain',
        size: 512,
        content: 'A simple text document example.',
        uploadedBy: user,
      },
    ];

    for (const docData of documents) {
      const document = documentRepository.create(docData);
      await documentRepository.save(document);
    }

    console.log(`Seeded ${documents.length} documents`);
  }
}
