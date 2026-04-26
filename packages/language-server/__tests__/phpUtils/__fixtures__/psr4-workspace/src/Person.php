<?php
declare(strict_types=1);

namespace App;

class Person
{
    public function getName(): string
    {
        return '';
    }

    public function getAge(): int
    {
        return 0;
    }

    public function getParent(): Person
    {
        return new self();
    }

    public function getOtherClass(): OtherClass
    {
        return new OtherClass();
    }

    public function setName(string $name): void
    {
    }

    public function greet(string $msg, int $count = 1, string ...$tags): bool
    {
        return true;
    }

    public function unionReturn(): int|string
    {
        return 0;
    }

    public function __construct()
    {
    }

    public function __toString(): string
    {
        return '';
    }
}
