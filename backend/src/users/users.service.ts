import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
      take: limit,
      skip: offset,
      order: { name: 'ASC' }
    });
  }

  async update(id: string, updateData: UpdateUserDto, currentUser: User): Promise<User> {
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      throw new ForbiddenException('You are not authorized to update this user');
    }

    if (updateData.role && currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can change roles');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.usersRepository.update(id, updateData);
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete users');
    }
    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.usersRepository.delete(id);
  }
}
