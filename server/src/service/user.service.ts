import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../domain/user.entity';
import { UserDTO } from './dto/user.dto';
import { UserMapper } from './mapper/user.mapper';
import { UserRepository } from '../repository/user.repository';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UserService {
    constructor(@InjectRepository(UserRepository) private userRepository: UserRepository) { }

    async findById(id: string): Promise<UserDTO | undefined> {
        const result = await this.userRepository.findOne(id);
        return UserMapper.fromEntityToDTO(this.flatAuthorities(result));
    }

    async findByfields(options: FindOneOptions<UserDTO>): Promise<UserDTO | undefined> {
        const result = await this.userRepository.findOne(options);
        return UserMapper.fromEntityToDTO(this.flatAuthorities(result));
    }

    async find(options: FindManyOptions<UserDTO>): Promise<UserDTO | undefined> {
        const result = await this.userRepository.findOne(options);
        return UserMapper.fromEntityToDTO(this.flatAuthorities(result));
    }

    async findAndCount(options: FindManyOptions<UserDTO>): Promise<[UserDTO[], number]> {
        const resultList = await this.userRepository.findAndCount(options);
        const usersDTO: UserDTO[] = [];
        if (resultList && resultList[0]) {
            resultList[0].forEach(user => usersDTO.push(UserMapper.fromEntityToDTO(this.flatAuthorities(user))));
            resultList[0] = usersDTO;
        }
        return resultList;
    }

    async save(userDTO: UserDTO): Promise<UserDTO | undefined> {
        const user = this.convertInAuthorities(UserMapper.fromDTOtoEntity(userDTO));
        const saltOrRounds = 10;
        user.password = await bcrypt.hash(user.password, saltOrRounds);
        const result = await this.userRepository.save(user);
        return UserMapper.fromEntityToDTO(this.flatAuthorities(result));
    }

    async update(userDTO: UpdateUserDto): Promise<UserDTO | undefined> {
        const user = this.convertInAuthorities(UserMapper.fromDTOtoEntity(userDTO));
        const update = await this.userRepository.save(user);
        return UserMapper.fromEntityToDTO(update);
    }

    async delete(userDTO: UserDTO): Promise<UserDTO | undefined> {
        const user = UserMapper.fromDTOtoEntity(userDTO);
        const result = await this.userRepository.remove(user);
        return UserMapper.fromEntityToDTO(result);
    }

    private flatAuthorities(user: any): User {
        if (user && user.authorities) {
            const authorities: string[] = [];
            user.authorities.forEach(authority => authorities.push(authority.name));
            user.authorities = authorities;
        }
        return user;
    }

    private convertInAuthorities(user: any): User {
        if (user && user.authorities) {
            const authorities: any[] = [];
            user.authorities.forEach(authority => authorities.push({ name: authority }));
            user.authorities = authorities;
        }
        return user;
    }
}